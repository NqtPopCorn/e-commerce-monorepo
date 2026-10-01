import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PromotionPricingService } from "../promotions/promotion-pricing.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PromotionPricingService,
    private readonly notificationsService: NotificationsService,
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

    // 1. Gửi thông báo cho khách hàng
    if (createdOrder) {
      await this.notificationsService.notifyUser(userId, {
        title: "Đặt hàng thành công",
        message: `Đơn hàng #${createdOrder.id} đã được tạo thành công và đang chờ xác nhận.`,
        type: "ORDER",
        level: "SUCCESS",
        link: "/orders",
        data: { orderId: createdOrder.id },
      });

      // 2. Gửi thông báo cho quản trị viên và nhân viên
      const customerName =
        [createdOrder.user?.firstName, createdOrder.user?.lastName]
          .filter(Boolean)
          .join(" ") ||
        createdOrder.recipientName ||
        "Khách hàng";
      const totalAmount =
        Number(createdOrder.total).toLocaleString("vi-VN") + "₫";

      await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
        title: "Đơn hàng mới",
        message: `Đơn hàng #${createdOrder.id} vừa được đặt bởi ${customerName} (${totalAmount}).`,
        type: "ORDER",
        level: "INFO",
        link: "/admin/orders",
        data: { orderId: createdOrder.id },
      });

      // 3. Kiểm tra cảnh báo tồn kho thấp (nếu tồn kho <= 5)
      for (const item of dto.items) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant) continue;
        if (variant.stock <= 5) {
          const prodName = variant.product?.name || variant.sku;
          const spec = [variant.size, variant.color]
            .filter(Boolean)
            .join(" - ");
          const specStr = spec ? ` (${spec})` : "";
          await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
            title: "Cảnh báo tồn kho thấp",
            message: `Sản phẩm "${prodName}"${specStr} chỉ còn ${variant.stock} chiếc.`,
            type: "INVENTORY",
            level: "WARNING",
            link: "/admin/products",
            data: { variantId: variant.id, stock: variant.stock },
          });
        }
      }
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

    // Thông báo cho Admin/Staff khi khách tự hủy đơn
    await this.notificationsService.notifyRoles(["ADMIN", "STAFF"], {
      title: "Đơn hàng đã bị hủy",
      message: `Khách hàng đã hủy đơn hàng #${orderId}.`,
      type: "ORDER",
      level: "WARNING",
      link: "/admin/orders",
      data: { orderId },
    });

    return result;
  }
}
