import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PromotionPricingService } from "../promotions/promotion-pricing.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PromotionPricingService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
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
        const voucher = await tx.promotion.findUnique({
          where: { id: voucherApp.id },
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
        await tx.promotion.update({
          where: { id: voucherApp.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
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
        order.items.map((item) => [item.variantId, item.id]),
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
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
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

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
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
  }
}
