import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { OrderStatusUpdatedEvent } from "../notifications/events/order.events";

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: { include: { variant: { include: { product: true } } } },
        discountApplications: true,
        voucherApplications: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    id: number,
    status?: string,
    paymentStatus?: string,
    currentUser?: { id: number; email: string; role: string },
    req?: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");

    const data: any = {};

    if (status) {
      const allowed = [
        "PENDING",
        "CONFIRMED",
        "SHIPPING",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!allowed.includes(status))
        throw new BadRequestException("Invalid order status");
      data.status = status as any;

      if (
        status === "COMPLETED" &&
        order.paymentMethod === "COD" &&
        !paymentStatus
      ) {
        data.paymentStatus = "PAID";
      }
    }

    if (paymentStatus) {
      const allowedPaymentStatus = ["UNPAID", "PAID", "REFUNDED"];
      if (!allowedPaymentStatus.includes(paymentStatus))
        throw new BadRequestException("Invalid payment status");
      data.paymentStatus = paymentStatus as any;
    }

    if (Object.keys(data).length === 0) {
      return order;
    }

    const oldValue = {
      status: order.status,
      paymentStatus: order.paymentStatus,
    };

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: { include: { variant: { include: { product: true } } } },
        discountApplications: true,
        voucherApplications: true,
      },
    });

    const newValue = {
      status: updated.status,
      paymentStatus: updated.paymentStatus,
    };

    const rawIp =
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;
    const ipAddress =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
    const userAgent = (req?.headers?.["user-agent"] as string) || null;

    const descParts: string[] = [];
    if (oldValue.status !== newValue.status) {
      descParts.push(`trạng thái [${oldValue.status} ➔ ${newValue.status}]`);
    }
    if (oldValue.paymentStatus !== newValue.paymentStatus) {
      descParts.push(
        `thanh toán [${oldValue.paymentStatus} ➔ ${newValue.paymentStatus}]`,
      );
    }

    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "ORDER_STATUS_UPDATE",
      entityType: "ORDER",
      entityId: String(id),
      description: `Cập nhật đơn hàng #${id}: ${descParts.join(", ")}`,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    // Phát sinh sự kiện thay đổi trạng thái bất đồng bộ - không block phản hồi của admin
    if (oldValue.status !== newValue.status) {
      this.eventEmitter.emit(
        "order.status_updated",
        new OrderStatusUpdatedEvent(order, oldValue.status, newValue.status),
      );
    }

    return updated;
  }
}
