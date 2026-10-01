import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PricingService } from "../pricing/pricing.service";
import {
  OrderCancelledEvent,
  OrderCreatedEvent,
} from "../notifications/events/order.events";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const variantIds = Array.from(new Set(dto.items.map((i) => i.variantId)));
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of dto.items) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new NotFoundException(
            `Sản phẩm biến thể ID ${item.variantId} không tồn tại`,
          );
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${variant.sku}" không đủ số lượng tồn kho (còn ${variant.stock})`,
          );
        }
      }

      const quote = await this.pricingService.quote(
        dto.items,
        dto.voucherCode,
        tx,
      );

      if (dto.voucherCode && quote.voucherError) {
        throw new BadRequestException(quote.voucherError);
      }

      for (const item of dto.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (quote.appliedVoucher) {
        const voucher = await tx.voucher.findUnique({
          where: { id: quote.appliedVoucher.voucherId },
        });
        if (
          !voucher ||
          !voucher.active ||
          (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
        ) {
          throw new BadRequestException(
            "Voucher đã hết lượt sử dụng hoặc không khả dụng",
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          paymentMethod: (dto.paymentMethod as any) || "COD",
          paymentStatus: "UNPAID",
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          shippingAddress: dto.shippingAddress,
          shippingNote: dto.shippingNote,
          subtotal: quote.subtotal,
          productDiscount: quote.productDiscount,
          voucherDiscount: quote.voucherDiscount,
          total: quote.total,
          items: {
            create: quote.lines.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
              originalUnitPrice: line.originalUnitPrice,
              productDiscount: line.productDiscount,
              finalUnitPrice: line.finalUnitPrice,
              unitPrice: line.finalUnitPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      const itemMapByVariant = new Map(
        (order?.items || []).map((item) => [item.variantId, item.id]),
      );

      // Lưu các discount dòng sản phẩm (ITEM-level)
      for (const app of quote.appliedDiscounts) {
        const orderItemId = itemMapByVariant.get(app.variantId);
        if (orderItemId) {
          await tx.discountApplication.create({
            data: {
              orderId: order.id,
              orderItemId,
              discountId: app.discountId,
              discountName: app.discountName,
              discountAmount: app.discountAmount,
            },
          });

          const disc = await tx.discount.findUnique({
            where: { id: app.discountId },
            select: { campaignId: true },
          });

          await tx.discount.update({
            where: { id: app.discountId },
            data: {
              spentAmount: { increment: app.discountAmount },
              usedCount: { increment: 1 },
            },
          });

          if (disc?.campaignId) {
            await tx.campaign.update({
              where: { id: disc.campaignId },
              data: {
                spentAmount: { increment: app.discountAmount },
              },
            });
          }
        }
      }

      // Lưu voucher giảm giá đơn hàng (ORDER-level)
      if (quote.appliedVoucher) {
        await tx.voucherApplication.create({
          data: {
            orderId: order.id,
            voucherId: quote.appliedVoucher.voucherId,
            voucherCode: quote.appliedVoucher.voucherCode,
            voucherName: quote.appliedVoucher.voucherName,
            discountAmount: quote.appliedVoucher.discountAmount,
          },
        });

        const v = await tx.voucher.findUnique({
          where: { id: quote.appliedVoucher.voucherId },
          select: { campaignId: true },
        });

        await tx.voucher.update({
          where: { id: quote.appliedVoucher.voucherId },
          data: {
            spentAmount: { increment: quote.appliedVoucher.discountAmount },
            usedCount: { increment: 1 },
          },
        });

        if (v?.campaignId) {
          await tx.campaign.update({
            where: { id: v.campaignId },
            data: {
              spentAmount: { increment: quote.appliedVoucher.discountAmount },
            },
          });
        }
      }

      return tx.order.findUnique({
        where: { id: order.id },
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
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
          discountApplications: true,
          voucherApplications: true,
        },
      });
    });

    // Phát sinh sự kiện bất đồng bộ - không block phản hồi tạo đơn của khách
    if (createdOrder) {
      this.eventEmitter.emit(
        "order.created",
        new OrderCreatedEvent(createdOrder, userId, dto.items),
      );
    }

    return createdOrder;
  }

  async findMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        discountApplications: true,
        voucherApplications: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
        discountApplications: true,
        voucherApplications: true,
      },
    });
    if (!order || order.userId !== userId)
      throw new NotFoundException("Đơn hàng không tồn tại");
    return order;
  }

  async cancel(userId: number, orderId: number) {
    const order = await this.findOne(userId, orderId);
    if (order.status !== "PENDING")
      throw new BadRequestException("Không thể hủy đơn hàng này");

    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Hoàn trả ngân sách và lượt dùng của các Discounts
      for (const app of order.discountApplications || []) {
        const disc = await tx.discount.findUnique({
          where: { id: app.discountId },
          select: { campaignId: true },
        });

        await tx.discount.update({
          where: { id: app.discountId },
          data: {
            spentAmount: { decrement: app.discountAmount },
            usedCount: { decrement: 1 },
          },
        });

        if (disc?.campaignId) {
          await tx.campaign.update({
            where: { id: disc.campaignId },
            data: {
              spentAmount: { decrement: app.discountAmount },
            },
          });
        }
      }

      // Hoàn trả ngân sách và lượt dùng của Voucher
      for (const app of order.voucherApplications || []) {
        const v = await tx.voucher.findUnique({
          where: { id: app.voucherId },
          select: { campaignId: true },
        });

        await tx.voucher.update({
          where: { id: app.voucherId },
          data: {
            spentAmount: { decrement: app.discountAmount },
            usedCount: { decrement: 1 },
          },
        });

        if (v?.campaignId) {
          await tx.campaign.update({
            where: { id: v.campaignId },
            data: {
              spentAmount: { decrement: app.discountAmount },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          discountApplications: true,
          voucherApplications: true,
        },
      });
    });

    // Phát sinh sự kiện hủy đơn bất đồng bộ
    if (result) {
      this.eventEmitter.emit(
        "order.cancelled",
        new OrderCancelledEvent(order, userId),
      );
    }

    return result;
  }
}
