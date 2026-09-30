import { BadRequestException, Injectable } from "@nestjs/common";
import { DiscountType, Prisma, PromotionApplicationType } from "@prisma/client";
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
    maxValue?: number | Prisma.Decimal | null,
  ): number {
    if (!type || value === undefined || value === null) return 0;
    const numValue = Number(value);
    if (base <= 0 || numValue <= 0) return 0;

    let discount = 0;
    if (type === DiscountType.PERCENT) {
      discount = Math.floor((base * numValue) / 100);
      if (maxValue !== undefined && maxValue !== null) {
        const maxLimit = Number(maxValue);
        if (maxLimit > 0) discount = Math.min(discount, maxLimit);
      }
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
        throw new BadRequestException(
          `Sản phẩm biến thể ID ${id} không tồn tại`,
        );
      }
    }

    const activePromotions = await client.promotion.findMany({
      where: {
        active: true,
        applicationType: PromotionApplicationType.AUTO,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      include: {
        campaign: true,
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: true,
          },
        },
      },
    });

    // Bản đồ theo dõi ngân sách đã phân bổ tạm thời trong lượt quote này
    const allocatedPromoBudgetMap = new Map<number, number>();
    const allocatedCampaignBudgetMap = new Map<number, number>();

    const getRemainingBudget = (promo: (typeof activePromotions)[0]) => {
      const promoSpent = Number(promo.spentAmount || 0);
      const promoAllocated = allocatedPromoBudgetMap.get(promo.id) || 0;
      const promoLimit =
        promo.budgetLimit !== null ? Number(promo.budgetLimit) : null;
      const promoRemaining =
        promoLimit !== null
          ? Math.max(0, promoLimit - promoSpent - promoAllocated)
          : Infinity;

      let campaignRemaining = Infinity;
      if (promo.campaign) {
        const campSpent = Number(promo.campaign.spentAmount || 0);
        const campAllocated =
          allocatedCampaignBudgetMap.get(promo.campaign.id) || 0;
        const campLimit =
          promo.campaign.budgetLimit !== null
            ? Number(promo.campaign.budgetLimit)
            : null;
        campaignRemaining =
          campLimit !== null
            ? Math.max(0, campLimit - campSpent - campAllocated)
            : Infinity;
      }

      return Math.min(promoRemaining, campaignRemaining);
    };

    const allocateBudget = (
      promo: (typeof activePromotions)[0],
      amount: number,
    ) => {
      allocatedPromoBudgetMap.set(
        promo.id,
        (allocatedPromoBudgetMap.get(promo.id) || 0) + amount,
      );
      if (promo.campaign) {
        allocatedCampaignBudgetMap.set(
          promo.campaign.id,
          (allocatedCampaignBudgetMap.get(promo.campaign.id) || 0) + amount,
        );
      }
    };

    // Phân loại: Promo có nhóm gắn variants cụ thể -> Giảm giá sản phẩm (LINE)
    const lineCampaigns = activePromotions.filter((p) =>
      p.groups.some((g) => g.variants && g.variants.length > 0),
    );

    // Promo có nhóm không gắn variant nào -> Giảm giá đơn hàng tự động (ORDER)
    const autoOrderPromos = activePromotions.filter((p) =>
      p.groups.some((g) => !g.variants || g.variants.length === 0),
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
        promo: (typeof activePromotions)[0];
        groupId: number;
        discountAmount: number;
      }[] = [];

      for (const campaign of lineCampaigns) {
        const remainingBudget = getRemainingBudget(campaign);
        if (remainingBudget <= 0) continue;

        for (const group of campaign.groups) {
          const matchesVariant = group.variants.some(
            (v) => v.variantId === item.variantId,
          );
          if (matchesVariant) {
            const rawDiscount = this.calculateDiscount(
              lineBase,
              group.discountType,
              group.discountValue,
              group.maxDiscountValue,
            );
            const discAmount = Math.min(rawDiscount, remainingBudget);
            if (discAmount > 0) {
              lineCampaignCandidates.push({
                promo: campaign,
                groupId: group.id,
                discountAmount: discAmount,
              });
            }
          }
        }
      }

      lineCampaignCandidates.sort((a, b) => {
        if (b.promo.priority !== a.promo.priority)
          return b.promo.priority - a.promo.priority;
        if (b.discountAmount !== a.discountAmount)
          return b.discountAmount - a.discountAmount;
        return a.promo.id - b.promo.id;
      });

      const campaignWinner = lineCampaignCandidates[0];
      let lineProductDiscount = 0;
      let campaignInfo:
        { id: number; name: string; groupId: number } | undefined;

      if (campaignWinner && campaignWinner.discountAmount > 0) {
        lineProductDiscount = campaignWinner.discountAmount;
        campaignInfo = {
          id: campaignWinner.promo.id,
          name: campaignWinner.promo.name,
          groupId: campaignWinner.groupId,
        };

        allocateBudget(campaignWinner.promo, lineProductDiscount);

        appliedPromotions.push({
          id: campaignWinner.promo.id,
          name: campaignWinner.promo.name,
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
      promo: (typeof activePromotions)[0];
      discountAmount: number;
    }[] = [];

    for (const autoPromo of autoOrderPromos) {
      const minAmount = autoPromo.minOrderAmount
        ? Number(autoPromo.minOrderAmount)
        : 0;
      if (subtotalAfterProductDiscount < minAmount) continue;

      const remainingBudget = getRemainingBudget(autoPromo);
      if (remainingBudget <= 0) continue;

      const orderGroup =
        autoPromo.groups.find((g) => !g.variants || g.variants.length === 0) ||
        autoPromo.groups[0];

      if (orderGroup) {
        const rawDisc = this.calculateDiscount(
          subtotalAfterProductDiscount,
          orderGroup.discountType,
          orderGroup.discountValue,
          orderGroup.maxDiscountValue,
        );
        const disc = Math.min(rawDisc, remainingBudget);
        if (disc > 0) {
          autoCandidates.push({
            promo: autoPromo,
            discountAmount: disc,
          });
        }
      }
    }

    autoCandidates.sort((a, b) => {
      if (b.promo.priority !== a.promo.priority)
        return b.promo.priority - a.promo.priority;
      if (b.discountAmount !== a.discountAmount)
        return b.discountAmount - a.discountAmount;
      return a.promo.id - b.promo.id;
    });

    const autoWinner = autoCandidates[0];
    if (autoWinner) {
      orderDiscount = autoWinner.discountAmount;
      allocateBudget(autoWinner.promo, orderDiscount);
      appliedPromotions.push({
        id: autoWinner.promo.id,
        name: autoWinner.promo.name,
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
      const voucher = await client.voucher.findUnique({
        where: { code: normalizedCode },
        include: {
          promotion: {
            include: {
              campaign: true,
              groups: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      if (!voucher) {
        voucherError = "Mã voucher không tồn tại";
      } else if (!voucher.active || !voucher.promotion.active) {
        voucherError = "Mã voucher đã bị khóa";
      } else if (
        (voucher.startsAt && voucher.startsAt > now) ||
        voucher.promotion.startsAt > now
      ) {
        voucherError = "Mã voucher chưa đến đợt áp dụng";
      } else if (
        (voucher.endsAt && voucher.endsAt <= now) ||
        (voucher.promotion.endsAt && voucher.promotion.endsAt <= now)
      ) {
        voucherError = "Mã voucher đã hết hạn";
      } else if (
        voucher.maxUses !== null &&
        voucher.usedCount >= voucher.maxUses
      ) {
        voucherError = "Mã voucher đã hết lượt sử dụng";
      } else if (
        voucher.promotion.maxUses !== null &&
        voucher.promotion.usedCount >= voucher.promotion.maxUses
      ) {
        voucherError =
          "Chương trình khuyến mãi của voucher đã hết lượt áp dụng";
      } else if (
        voucher.promotion.minOrderAmount !== null &&
        remainingBeforeVoucher < Number(voucher.promotion.minOrderAmount)
      ) {
        voucherError =
          "Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher này";
      } else {
        // Kiểm tra ngân sách voucher
        const promoLimit =
          voucher.promotion.budgetLimit !== null
            ? Number(voucher.promotion.budgetLimit)
            : null;
        const promoSpent = Number(voucher.promotion.spentAmount || 0);
        const promoRemaining =
          promoLimit !== null ? Math.max(0, promoLimit - promoSpent) : Infinity;

        let campaignRemaining = Infinity;
        if (voucher.promotion.campaign) {
          const campLimit =
            voucher.promotion.campaign.budgetLimit !== null
              ? Number(voucher.promotion.campaign.budgetLimit)
              : null;
          const campSpent = Number(voucher.promotion.campaign.spentAmount || 0);
          campaignRemaining =
            campLimit !== null ? Math.max(0, campLimit - campSpent) : Infinity;
        }

        const availableBudget = Math.min(promoRemaining, campaignRemaining);

        if (availableBudget <= 0) {
          voucherError = "Chương trình voucher đã hết ngân sách khả dụng";
        } else {
          const voucherGroup = voucher.promotion.groups[0];
          if (voucherGroup) {
            const rawDiscount = this.calculateDiscount(
              remainingBeforeVoucher,
              voucherGroup.discountType,
              voucherGroup.discountValue,
              voucherGroup.maxDiscountValue,
            );
            voucherDiscount = Math.min(rawDiscount, availableBudget);
            if (voucherDiscount > 0) {
              appliedPromotions.push({
                id: voucher.promotion.id,
                name: voucher.promotion.name,
                code: voucher.code,
                scope: "VOUCHER",
                discountAmount: voucherDiscount,
              });
            }
          }
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
