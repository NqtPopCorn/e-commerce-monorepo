import { BadRequestException, Injectable } from "@nestjs/common";
import { DiscountType, Prisma, PromotionKind } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type PricingItem = {
  variantId: number;
  quantity: number;
};

export type QuoteLine = {
  variantId: number;
  quantity: number;
  originalUnitPrice: number;
  productDiscount: number;
  finalUnitPrice: number;
  campaign?: { id: number; name: string; groupId: number };
};

export type AppliedPromotion = {
  id: number;
  name: string;
  code?: string;
  scope: "LINE" | "ORDER" | "VOUCHER";
  discountAmount: number;
};

export type PromotionQuote = {
  lines: QuoteLine[];
  subtotal: number;
  productDiscount: number;
  orderDiscount: number;
  voucherDiscount: number;
  total: number;
  applied: AppliedPromotion[];
  voucherError?: string;
};

@Injectable()
export class PromotionPricingService {
  constructor(private readonly prisma: PrismaService) {}

  calculateDiscount(
    base: number,
    type: DiscountType | null | undefined,
    value: number | Prisma.Decimal | null | undefined,
  ): number {
    if (!type || value === undefined || value === null) return 0;
    const numValue = Number(value);
    if (base <= 0 || numValue <= 0) return 0;

    let discount = 0;
    if (type === DiscountType.PERCENT) {
      discount = Math.floor((base * numValue) / 100);
    } else if (type === DiscountType.FIXED) {
      discount = Math.min(base, numValue);
    }

    return Math.max(0, Math.min(base, Math.floor(discount)));
  }

  async quote(
    items: PricingItem[],
    voucherCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PromotionQuote> {
    const client = tx || this.prisma;
    const now = new Date();

    if (!items || items.length === 0) {
      throw new BadRequestException("Danh sách sản phẩm không được rỗng");
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException("Số lượng sản phẩm phải lớn hơn 0");
      }
    }

    const variantIds = Array.from(new Set(items.map((i) => i.variantId)));
    const variants = await client.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    for (const id of variantIds) {
      if (!variantMap.has(id)) {
        throw new BadRequestException(`Sản phẩm biến thể ID ${id} không tồn tại`);
      }
    }

    const activePromotions = await client.promotion.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      include: {
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: true,
          },
        },
      },
    });

    const campaigns = activePromotions.filter(
      (p) => p.kind === PromotionKind.CAMPAIGN,
    );
    const autoOrderPromos = activePromotions.filter(
      (p) => p.kind === PromotionKind.ORDER_AUTO,
    );

    const quoteLines: QuoteLine[] = [];
    const appliedPromotions: AppliedPromotion[] = [];
    let totalProductDiscount = 0;
    let totalSubtotal = 0;

    for (const item of items) {
      const dbVariant = variantMap.get(item.variantId)!;
      const originalUnitPrice = Number(dbVariant.sellingPrice);
      const lineBase = originalUnitPrice * item.quantity;
      totalSubtotal += lineBase;

      const lineCampaignCandidates: {
        promotionId: number;
        promotionName: string;
        priority: number;
        groupId: number;
        discountAmount: number;
      }[] = [];

      for (const campaign of campaigns) {
        for (const group of campaign.groups) {
          const matchesVariant = group.variants.some(
            (v) => v.variantId === item.variantId,
          );
          if (matchesVariant) {
            const discAmount = this.calculateDiscount(
              lineBase,
              group.discountType,
              group.discountValue,
            );
            lineCampaignCandidates.push({
              promotionId: campaign.id,
              promotionName: campaign.name,
              priority: campaign.priority ?? 0,
              groupId: group.id,
              discountAmount: discAmount,
            });
          }
        }
      }

      lineCampaignCandidates.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.discountAmount !== a.discountAmount) return b.discountAmount - a.discountAmount;
        return a.promotionId - b.promotionId;
      });

      const campaignWinner = lineCampaignCandidates[0];
      let lineProductDiscount = 0;
      let campaignInfo: { id: number; name: string; groupId: number } | undefined;

      if (campaignWinner && campaignWinner.discountAmount > 0) {
        lineProductDiscount = campaignWinner.discountAmount;
        campaignInfo = {
          id: campaignWinner.promotionId,
          name: campaignWinner.promotionName,
          groupId: campaignWinner.groupId,
        };

        appliedPromotions.push({
          id: campaignWinner.promotionId,
          name: campaignWinner.promotionName,
          scope: "LINE",
          discountAmount: lineProductDiscount,
        });
      }

      totalProductDiscount += lineProductDiscount;
      const finalLineAmount = lineBase - lineProductDiscount;
      const finalUnitPrice = Math.max(
        0,
        Math.floor(finalLineAmount / item.quantity),
      );

      quoteLines.push({
        variantId: item.variantId,
        quantity: item.quantity,
        originalUnitPrice,
        productDiscount: lineProductDiscount,
        finalUnitPrice,
        campaign: campaignInfo,
      });
    }

    const subtotalAfterProductDiscount = totalSubtotal - totalProductDiscount;

    let orderDiscount = 0;
    const autoCandidates: {
      id: number;
      name: string;
      discountAmount: number;
    }[] = [];

    for (const autoPromo of autoOrderPromos) {
      const minAmount = autoPromo.minOrderAmount
        ? Number(autoPromo.minOrderAmount)
        : 0;
      if (subtotalAfterProductDiscount >= minAmount) {
        const disc = this.calculateDiscount(
          subtotalAfterProductDiscount,
          autoPromo.discountType,
          autoPromo.discountValue,
        );
        if (disc > 0) {
          autoCandidates.push({
            id: autoPromo.id,
            name: autoPromo.name,
            discountAmount: disc,
          });
        }
      }
    }

    autoCandidates.sort((a, b) => {
      if (b.discountAmount !== a.discountAmount) return b.discountAmount - a.discountAmount;
      return a.id - b.id;
    });

    const autoWinner = autoCandidates[0];
    if (autoWinner) {
      orderDiscount = autoWinner.discountAmount;
      appliedPromotions.push({
        id: autoWinner.id,
        name: autoWinner.name,
        scope: "ORDER",
        discountAmount: orderDiscount,
      });
    }

    const remainingBeforeVoucher = Math.max(
      0,
      subtotalAfterProductDiscount - orderDiscount,
    );

    let voucherDiscount = 0;
    let voucherError: string | undefined;

    if (voucherCode && voucherCode.trim().length > 0) {
      const normalizedCode = voucherCode.trim().toUpperCase();
      const voucher = await client.promotion.findUnique({
        where: { code: normalizedCode },
      });

      if (!voucher || voucher.kind !== PromotionKind.VOUCHER) {
        voucherError = "Mã voucher không tồn tại";
      } else if (!voucher.active) {
        voucherError = "Mã voucher đã bị khóa";
      } else if (voucher.startsAt > now) {
        voucherError = "Mã voucher chưa đến đợt áp dụng";
      } else if (voucher.endsAt && voucher.endsAt <= now) {
        voucherError = "Mã voucher đã hết hạn";
      } else if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
        voucherError = "Mã voucher đã hết lượt sử dụng";
      } else if (
        voucher.minOrderAmount !== null &&
        remainingBeforeVoucher < Number(voucher.minOrderAmount)
      ) {
        voucherError = "Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher này";
      } else {
        voucherDiscount = this.calculateDiscount(
          remainingBeforeVoucher,
          voucher.discountType,
          voucher.discountValue,
        );
        if (voucherDiscount > 0) {
          appliedPromotions.push({
            id: voucher.id,
            name: voucher.name,
            code: voucher.code || undefined,
            scope: "VOUCHER",
            discountAmount: voucherDiscount,
          });
        }
      }
    }

    const total = Math.max(
      0,
      totalSubtotal - totalProductDiscount - orderDiscount - voucherDiscount,
    );

    return {
      lines: quoteLines,
      subtotal: totalSubtotal,
      productDiscount: totalProductDiscount,
      orderDiscount,
      voucherDiscount,
      total,
      applied: appliedPromotions,
      voucherError,
    };
  }
}
