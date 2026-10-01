import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PromotionPricingService } from "../promotions/promotion-pricing.service";
import {
  OrderCancelledEvent,
  OrderCreatedEvent,
} from "../notifications/events/order.events";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PromotionPricingService,
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

      const voucherApp = quote.applied.find((a) => a.scope === "VOUCHER");
      if (voucherApp) {
        let isExhausted = false;
        if (voucherApp.code) {
          const voucher = await tx.voucher.findUnique({
            where: { code: voucherApp.code.trim().toUpperCase() },
            include: { promotion: true },
          });
          if (
            !voucher ||
            !voucher.active ||
            !voucher.promotion.active ||
            (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
          ) {
            isExhausted = true;
          }
        } else {
          const promo = await tx.promotion.findUnique({
            where: { id: voucherApp.id },
          });
          if (
            !promo ||
            !promo.active ||
            (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
          ) {
            isExhausted = true;
          }
        }

        if (isExhausted) {
          throw new BadRequestException(
            "Voucher đã hết lượt sử dụng hoặc không khả dụng",
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          paymentMethod: (dto.paymentMethod as any) || "COD",
          paymentStatus: "UNPAID",
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          shippingAddress: dto.shippingAddress,
          shippingNote: dto.shippingNote,
          subtotal: quote.subtotal,
          productDiscount: quote.productDiscount,
          orderDiscount: quote.orderDiscount,
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

      for (const app of quote.applied) {
        let orderItemId: number | null = null;
        if (app.scope === "LINE") {
          const line = quote.lines.find(
            (l) =>
              l.campaign?.id === app.id &&
              app.discountAmount === l.productDiscount,
          );
          if (line) {
            orderItemId = itemMapByVariant.get(line.variantId) || null;
          }
        }

        await tx.promotionApplication.create({
          data: {
            orderId: order.id,
            orderItemId: orderItemId,
            promotionId: app.id,
            scope: app.scope,
            promotionName: app.name,
            promotionCode: app.code || null,
            discountAmount: app.discountAmount,
          },
        });

        const promo = await tx.promotion.findUnique({
          where: { id: app.id },
          select: { campaignId: true },
        });

        await tx.promotion.update({
          where: { id: app.id },
          data: {
            spentAmount: { increment: app.discountAmount },
            usedCount: { increment: 1 },
          },
        });

        if (promo?.campaignId) {
          await tx.campaign.update({
            where: { id: promo.campaignId },
            data: {
              spentAmount: { increment: app.discountAmount },
            },
          });
        }

        if (app.scope === "VOUCHER" && app.code) {
          await tx.voucher.update({
            where: { code: app.code.trim().toUpperCase() },
            data: {
              usedCount: { increment: 1 },
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
          promotionApplications: true,
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
        promotionApplications: true,
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
        promotionApplications: true,
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

      for (const app of order.promotionApplications || []) {
        const promo = await tx.promotion.findUnique({
          where: { id: app.promotionId },
          select: { campaignId: true },
        });

        await tx.promotion.update({
          where: { id: app.promotionId },
          data: {
            spentAmount: { decrement: app.discountAmount },
            usedCount: { decrement: 1 },
          },
        });

        if (promo?.campaignId) {
          await tx.campaign.update({
            where: { id: promo.campaignId },
            data: {
              spentAmount: { decrement: app.discountAmount },
            },
          });
        }

        if (app.scope === "VOUCHER" && app.promotionCode) {
          await tx.voucher.update({
            where: { code: app.promotionCode.trim().toUpperCase() },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          promotionApplications: true,
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
