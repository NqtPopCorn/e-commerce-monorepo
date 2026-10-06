import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { OrderStatusUpdatedEvent } from "../notifications/events/order.events";
import { SePayWebhookDto } from "./dto/sepay-webhook.dto";
import { SimulatePaymentDto } from "./dto/simulate-payment.dto";
import { VietQRService, VietQRInfoResponse } from "./providers/vietqr.service";
import { extractOrderIdFromMemo } from "./utils/transfer-code";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vietqrService: VietQRService,
    private readonly config: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Idempotency ledger record.
   * Returns true if event is newly recorded, false if already processed (duplicate).
   */
  async recordEvent(source: string, eventId: string): Promise<boolean> {
    try {
      await this.prisma.paymentEvent.create({
        data: { source, eventId },
      });
      return true;
    } catch (e: any) {
      if (e?.code === "P2002") {
        return false;
      }
      throw e;
    }
  }

  /**
   * Get VietQR info (QR code, account details, memo) for an order.
   */
  async getVietQRInfo(
    userId: number,
    orderId: number,
  ): Promise<VietQRInfoResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền truy cập đơn hàng này");
    }

    // Calculate previously paid amount from SUCCESS transactions
    const paidTxs = await this.prisma.paymentTransaction.findMany({
      where: {
        orderId: order.id,
        status: "SUCCESS",
      },
    });
    const paidAmount = paidTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const orderTotal = Math.round(Number(order.total));
    const remainingAmount = Math.max(0, orderTotal - paidAmount);
    const isPartial = paidAmount > 0 && remainingAmount > 0;
    const chargeAmount = remainingAmount > 0 ? remainingAmount : orderTotal;

    // Ensure a pending transaction exists
    const existingTx = await this.prisma.paymentTransaction.findFirst({
      where: {
        orderId: order.id,
        provider: "VIETQR",
        status: "PENDING",
      },
    });

    if (!existingTx && order.paymentStatus === "UNPAID") {
      await this.prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: "VIETQR",
          amount: chargeAmount,
          currency: "VND",
          status: "PENDING",
          transactionCode: `DH${order.id}`,
        },
      });
    }

    return this.vietqrService.generateVietQR({
      id: order.id,
      total: chargeAmount,
      totalOrderAmount: orderTotal,
      paidAmount,
      remainingAmount,
      isPartial,
    });
  }

  /**
   * Webhook handler for bank transfer notifications (SePay / Casso / Bank).
   */
  async handleVietQRWebhook(
    dto: SePayWebhookDto,
    authHeader?: string,
  ): Promise<{ success: boolean; message: string; orderId?: number }> {
    // 1. Verify webhook secret / API Key
    const configuredApiKey =
      this.config.get<string>("VIETQR_WEBHOOK_API_KEY") ||
      "sepay-secret-api-key-123";

    if (configuredApiKey) {
      const incomingKey = (authHeader || "")
        .replace(/^(Apikey|Bearer)\s+/i, "")
        .trim();
      if (!incomingKey || incomingKey !== configuredApiKey) {
        this.logger.warn(
          `Webhook unauthorized attempt with header: ${authHeader}`,
        );
        throw new UnauthorizedException("Invalid Webhook API Key");
      }
    }

    // 2. Filter out non-credit transactions (we only process incoming money)
    if (dto.transferType && dto.transferType.toLowerCase() !== "in") {
      this.logger.log(
        `Skipping transfer of type "${dto.transferType}" (only "in" accepted)`,
      );
      return { success: true, message: "Transfer type not incoming" };
    }

    // 3. Check destination account if present
    const myAccount = this.vietqrService.getAccountNo();
    if (dto.accountNumber && dto.accountNumber !== myAccount) {
      this.logger.warn(
        `Transfer account mismatch: received ${dto.accountNumber}, expected ${myAccount}`,
      );
      return { success: true, message: "Transfer account number mismatch" };
    }

    // 4. Idempotency Check using PaymentEvent
    const eventId = String(dto.id || dto.referenceCode || Date.now());
    const isNewEvent = await this.recordEvent("sepay", eventId);
    if (!isNewEvent) {
      this.logger.warn(`Duplicate webhook event ignored: sepay #${eventId}`);
      return { success: true, message: "Duplicate transaction ignored" };
    }

    // 5. Extract Order ID from memo
    const memoContent = dto.code || dto.content || dto.description || "";
    const orderId = extractOrderIdFromMemo(memoContent, "DH");

    if (!orderId) {
      this.logger.warn(
        `Unmatched transfer: no order ID found in memo "${memoContent}" (eventId: ${eventId})`,
      );
      return {
        success: true,
        message: "No matching order ID found in transfer memo",
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!order) {
      this.logger.warn(
        `Order #${orderId} referenced in memo "${memoContent}" does not exist`,
      );
      return { success: true, message: "Referenced order does not exist" };
    }

    // If order is already paid, do not re-process
    if (order.paymentStatus === "PAID") {
      this.logger.log(
        `Order #${order.id} is already PAID. Webhook acknowledged.`,
      );
      return {
        success: true,
        message: "Order is already paid",
        orderId: order.id,
      };
    }

    // 6. Amount Verification & Partial Payment Accumulation
    const transferAmount = Math.round(
      Number(dto.transferAmount || dto.amount || 0),
    );
    if (transferAmount <= 0) {
      this.logger.warn(`Ignoring invalid transfer amount: ${transferAmount}`);
      return { success: true, message: "Invalid transfer amount" };
    }

    const orderTotal = Math.round(Number(order.total));

    // Calculate sum of existing SUCCESS transactions
    const existingSuccessTxs = await this.prisma.paymentTransaction.findMany({
      where: { orderId: order.id, status: "SUCCESS" },
    });
    const previouslyPaid = existingSuccessTxs.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0,
    );
    const newTotalPaid = previouslyPaid + transferAmount;
    const remainingAfterTransfer = Math.max(0, orderTotal - newTotalPaid);

    const oldStatus = order.status;
    const oldPaymentStatus = order.paymentStatus;

    if (newTotalPaid < orderTotal) {
      // PARTIAL PAYMENT CASE (Chuyển thiếu tiền -> Ghi nhận số tiền đã chuyển và cập nhật còn thiếu)
      this.logger.log(
        `Order #${order.id} partially paid: received +${transferAmount} VND. Total paid: ${newTotalPaid}/${orderTotal} VND. Remaining: ${remainingAfterTransfer} VND.`,
      );

      // Record successful partial payment transaction
      await this.prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: "VIETQR",
          amount: transferAmount,
          currency: "VND",
          status: "SUCCESS",
          providerTxnId: eventId,
          transactionCode: `DH${order.id}`,
          paidAt: new Date(),
          metadata: {
            ...dto,
            isPartial: true,
            accumulatedPaid: newTotalPaid,
            remainingAmount: remainingAfterTransfer,
            orderTotal,
          } as any,
        },
      });

      // Update order to PENDING payment status if it was UNPAID
      if (order.paymentStatus === "UNPAID") {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PENDING" },
        });
      }

      await this.auditLogsService.log({
        userId: order.userId,
        userEmail: order.user?.email,
        action: "PAYMENT_PARTIAL_WEBHOOK",
        entityType: "ORDER",
        entityId: String(order.id),
        description: `Nhận thanh toán một phần VietQR đơn #${order.id}: +${transferAmount.toLocaleString("vi-VN")} đ. Đã nhận: ${newTotalPaid.toLocaleString("vi-VN")}/${orderTotal.toLocaleString("vi-VN")} đ (Còn thiếu: ${remainingAfterTransfer.toLocaleString("vi-VN")} đ)`,
        oldValue: { status: oldStatus, paymentStatus: oldPaymentStatus },
        newValue: {
          status: order.status,
          paymentStatus: "PENDING",
          paidAmount: newTotalPaid,
          remainingAmount: remainingAfterTransfer,
        },
        status: "SUCCESS",
      });

      return {
        success: true,
        message: `Đã ghi nhận thanh toán một phần: +${transferAmount.toLocaleString("vi-VN")} đ. Tổng đã nhận: ${newTotalPaid.toLocaleString("vi-VN")} đ. Còn thiếu: ${remainingAfterTransfer.toLocaleString("vi-VN")} đ.`,
        orderId: order.id,
      };
    }

    // FULL PAYMENT CASE (Số tiền tích lũy đã đủ hoặc dư)
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: "VIETQR",
          amount: transferAmount,
          currency: "VND",
          status: "SUCCESS",
          providerTxnId: eventId,
          transactionCode: `DH${order.id}`,
          paidAt: new Date(),
          metadata: {
            ...dto,
            isPartial: false,
            accumulatedPaid: newTotalPaid,
            remainingAmount: 0,
            orderTotal,
          } as any,
        },
      });
    });

    // Audit Log & Event
    await this.auditLogsService.log({
      userId: order.userId,
      userEmail: order.user?.email,
      action: "PAYMENT_CONFIRMED_WEBHOOK",
      entityType: "ORDER",
      entityId: String(order.id),
      description: `Thanh toán VietQR hoàn tất đơn hàng #${order.id} qua Webhook ngân hàng (Số tiền nhận lần này: ${transferAmount.toLocaleString("vi-VN")} đ, Tổng đã trả: ${newTotalPaid.toLocaleString("vi-VN")} đ, GD: ${eventId})`,
      oldValue: { status: oldStatus, paymentStatus: oldPaymentStatus },
      newValue: { status: "CONFIRMED", paymentStatus: "PAID" },
      status: "SUCCESS",
    });

    this.eventEmitter.emit(
      "order.status_updated",
      new OrderStatusUpdatedEvent(order, oldStatus, "CONFIRMED"),
    );

    return {
      success: true,
      message: "Payment confirmed successfully",
      orderId: order.id,
    };
  }

  /**
   * Admin manual confirmation of VietQR payment.
   */
  async confirmVietQRManually(
    orderId: number,
    adminUser?: { id: number; email: string; role: string },
    req?: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại");
    }

    if (order.paymentStatus === "PAID") {
      return order;
    }

    const eventId = `manual_${orderId}_${Date.now()}`;
    await this.recordEvent("manual_admin", eventId);

    const oldStatus = order.status;
    const oldPaymentStatus = order.paymentStatus;

    const updated = await this.prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          items: { include: { variant: { include: { product: true } } } },
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: "VIETQR",
          amount: order.total,
          currency: "VND",
          status: "SUCCESS",
          providerTxnId: eventId,
          transactionCode: `DH${order.id}`,
          paidAt: new Date(),
          metadata: {
            method: "MANUAL_ADMIN_CONFIRM",
            adminId: adminUser?.id,
            adminEmail: adminUser?.email,
          },
        },
      });

      return ord;
    });

    const rawIp =
      req?.headers?.["x-forwarded-for"] ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      null;
    const ipAddress =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
    const userAgent = (req?.headers?.["user-agent"] as string) || null;

    await this.auditLogsService.log({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      userRole: adminUser?.role,
      action: "ORDER_PAYMENT_CONFIRMED_MANUAL",
      entityType: "ORDER",
      entityId: String(orderId),
      description: `Admin xác nhận nhận tiền chuyển khoản VietQR cho đơn hàng #${orderId}`,
      oldValue: { status: oldStatus, paymentStatus: oldPaymentStatus },
      newValue: { status: "CONFIRMED", paymentStatus: "PAID" },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    this.eventEmitter.emit(
      "order.status_updated",
      new OrderStatusUpdatedEvent(order, oldStatus, "CONFIRMED"),
    );

    return updated;
  }

  /**
   * Check order payment status for frontend polling.
   */
  async getOrderPaymentStatus(orderId: number, userId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại");
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException(
        "Bạn không có quyền xem thông tin đơn hàng này",
      );
    }

    const paidTxs = await this.prisma.paymentTransaction.findMany({
      where: { orderId: order.id, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });
    const paidAmount = paidTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const orderTotal = Math.round(Number(order.total));
    const remainingAmount = Math.max(0, orderTotal - paidAmount);

    return {
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: orderTotal,
      paidAmount,
      remainingAmount,
      isPartial: paidAmount > 0 && remainingAmount > 0,
      transactions: paidTxs.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        providerTxnId: tx.providerTxnId,
        paidAt: tx.paidAt || tx.createdAt,
      })),
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Sandbox simulation: creates and delivers an incoming bank transfer webhook locally.
   */
  async simulatePayment(dto: SimulatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng #${dto.orderId} không tồn tại`);
    }

    // Get current paid amount to compute default remaining transfer
    const paidTxs = await this.prisma.paymentTransaction.findMany({
      where: { orderId: order.id, status: "SUCCESS" },
      select: { amount: true },
    });
    const previouslyPaid = paidTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const orderTotal = Math.round(Number(order.total));
    const remainingAmount = Math.max(0, orderTotal - previouslyPaid);

    const scenario = dto.scenario || "SUCCESS";
    let transferAmount = dto.amount;

    if (!transferAmount) {
      if (scenario === "UNDERPAID") {
        transferAmount = Math.max(
          10000,
          Math.floor((remainingAmount > 0 ? remainingAmount : orderTotal) / 2),
        );
      } else {
        transferAmount = remainingAmount > 0 ? remainingAmount : orderTotal;
      }
    }

    let memoContent = dto.customContent;
    if (!memoContent) {
      if (scenario === "WRONG_MEMO") {
        memoContent = "Chuyen tien mua hang khong ghi ma don";
      } else {
        memoContent = `DH${order.id} thanh toan`;
      }
    }

    const eventId =
      scenario === "DUPLICATE"
        ? `SANDBOX_DUP_${order.id}`
        : `SANDBOX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const webhookPayload: SePayWebhookDto = {
      id: eventId,
      gateway: "MBBank",
      transactionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      accountNumber: this.vietqrService.getAccountNo(),
      code: undefined,
      content: memoContent,
      transferType: "in",
      transferAmount,
      referenceCode: `FT_${eventId}`,
      description: memoContent,
    };

    const apiKey =
      this.config.get<string>("VIETQR_WEBHOOK_API_KEY") ||
      "sepay-secret-api-key-123";

    const result = await this.handleVietQRWebhook(
      webhookPayload,
      `Apikey ${apiKey}`,
    );

    return {
      simulation: {
        scenario,
        payload: webhookPayload,
      },
      result,
    };
  }
}
