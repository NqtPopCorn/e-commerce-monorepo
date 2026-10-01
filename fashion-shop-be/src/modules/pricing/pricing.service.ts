import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { calculateDiscountAmount } from "../../common/utils/discount-calculator";
import {
  AppliedDiscount,
  AppliedVoucher,
  OrderQuote,
  PricingItem,
  QuoteLine,
} from "./types/pricing.types";

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán báo giá đơn hàng:
   * 1. Áp dụng Discount dòng sản phẩm (ITEM-level) trước
   * 2. Tính Subtotal sau khi đã trừ giảm giá sản phẩm
   * 3. Áp dụng Voucher cấp đơn hàng (ORDER-level)
   * 4. Tính Total cuối cùng
   */
  async quote(
    items: PricingItem[],
    voucherCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrderQuote> {
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
          `Sản phẩm biến thể ID ${id} không tồn tại trong hệ thống`,
        );
      }
    }

    // 1. Lấy tất cả Discount đang hoạt động (LINE scope)
    const activeDiscounts = await client.discount.findMany({
      where: {
        active: true,
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

    // Bản đồ theo dõi ngân sách tạm thời trong phiên tính giá này
    const allocatedDiscountBudgetMap = new Map<number, number>();
    const allocatedCampaignBudgetMap = new Map<number, number>();

    const getRemainingBudget = (discount: (typeof activeDiscounts)[0]) => {
      const discSpent = Number(discount.spentAmount || 0);
      const discAllocated = allocatedDiscountBudgetMap.get(discount.id) || 0;
      const discLimit =
        discount.budgetLimit !== null ? Number(discount.budgetLimit) : null;
      const discRemaining =
        discLimit !== null
          ? Math.max(0, discLimit - discSpent - discAllocated)
          : Infinity;

      let campaignRemaining = Infinity;
      if (discount.campaign) {
        const campSpent = Number(discount.campaign.spentAmount || 0);
        const campAllocated =
          allocatedCampaignBudgetMap.get(discount.campaign.id) || 0;
        const campLimit =
          discount.campaign.budgetLimit !== null
            ? Number(discount.campaign.budgetLimit)
            : null;
        campaignRemaining =
          campLimit !== null
            ? Math.max(0, campLimit - campSpent - campAllocated)
            : Infinity;
      }

      return Math.min(discRemaining, campaignRemaining);
    };

    const allocateBudget = (
      discount: (typeof activeDiscounts)[0],
      amount: number,
    ) => {
      allocatedDiscountBudgetMap.set(
        discount.id,
        (allocatedDiscountBudgetMap.get(discount.id) || 0) + amount,
      );
      if (discount.campaign) {
        allocatedCampaignBudgetMap.set(
          discount.campaign.id,
          (allocatedCampaignBudgetMap.get(discount.campaign.id) || 0) + amount,
        );
      }
    };

    const quoteLines: QuoteLine[] = [];
    const appliedDiscounts: AppliedDiscount[] = [];
    let totalProductDiscount = 0;
    let totalSubtotal = 0;

    // 2. Tính giảm giá dòng sản phẩm (ITEM-level)
    for (const item of items) {
      const dbVariant = variantMap.get(item.variantId)!;
      const originalUnitPrice = Number(dbVariant.sellingPrice);
      const lineBase = originalUnitPrice * item.quantity;
      totalSubtotal += lineBase;

      const candidates: {
        discount: (typeof activeDiscounts)[0];
        group: (typeof activeDiscounts)[0]["groups"][0];
        discountAmount: number;
      }[] = [];

      for (const disc of activeDiscounts) {
        const remainingBudget = getRemainingBudget(disc);
        if (remainingBudget <= 0) continue;

        for (const group of disc.groups) {
          const matches = group.variants.some(
            (v) => v.variantId === item.variantId,
          );
          if (matches) {
            const rawDiscount = calculateDiscountAmount(
              lineBase,
              group.discountType,
              group.discountValue,
              group.maxDiscountValue,
            );
            const finalAmount = Math.min(rawDiscount, remainingBudget);
            if (finalAmount > 0) {
              candidates.push({
                discount: disc,
                group,
                discountAmount: finalAmount,
              });
            }
          }
        }
      }

      // Sắp xếp ưu tiên: priority cao hơn -> số tiền giảm lớn hơn -> discount ID nhỏ hơn
      candidates.sort((a, b) => {
        if (b.discount.priority !== a.discount.priority) {
          return b.discount.priority - a.discount.priority;
        }
        if (b.discountAmount !== a.discountAmount) {
          return b.discountAmount - a.discountAmount;
        }
        return a.discount.id - b.discount.id;
      });

      const winner = candidates[0];
      let lineProductDiscount = 0;
      let discountInfo:
        | { id: number; name: string; groupId: number }
        | undefined;

      if (winner && winner.discountAmount > 0) {
        lineProductDiscount = winner.discountAmount;
        discountInfo = {
          id: winner.discount.id,
          name: winner.discount.name,
          groupId: winner.group.id,
        };

        allocateBudget(winner.discount, lineProductDiscount);

        appliedDiscounts.push({
          discountId: winner.discount.id,
          discountName: winner.discount.name,
          groupId: winner.group.id,
          variantId: item.variantId,
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
        discount: discountInfo,
      });
    }

    // 3. Subtotal sau khi đã trừ giảm giá sản phẩm (để làm cơ sở cho Voucher)
    const subtotalAfterProductDiscount = totalSubtotal - totalProductDiscount;

    // 4. Tính giảm giá Voucher cấp đơn hàng (ORDER-level)
    let voucherDiscount = 0;
    let appliedVoucher: AppliedVoucher | undefined;
    let voucherError: string | undefined;

    if (voucherCode && voucherCode.trim().length > 0) {
      const normalizedCode = voucherCode.trim().toUpperCase();
      const voucher = await client.voucher.findUnique({
        where: { code: normalizedCode },
        include: {
          campaign: true,
        },
      });

      if (!voucher) {
        voucherError = "Mã voucher không tồn tại";
      } else if (!voucher.active) {
        voucherError = "Mã voucher đã bị khóa hoặc ngừng áp dụng";
      } else if (voucher.startsAt && voucher.startsAt > now) {
        voucherError = "Mã voucher chưa đến đợt áp dụng";
      } else if (voucher.endsAt && voucher.endsAt <= now) {
        voucherError = "Mã voucher đã hết hạn";
      } else if (
        voucher.maxUses !== null &&
        voucher.usedCount >= voucher.maxUses
      ) {
        voucherError = "Mã voucher đã hết lượt sử dụng";
      } else if (
        voucher.minOrderAmount !== null &&
        subtotalAfterProductDiscount < Number(voucher.minOrderAmount)
      ) {
        voucherError = "Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher này";
      } else {
        // Kiểm tra ngân sách còn lại của voucher và campaign
        const voucherLimit =
          voucher.budgetLimit !== null ? Number(voucher.budgetLimit) : null;
        const voucherSpent = Number(voucher.spentAmount || 0);
        const voucherRemaining =
          voucherLimit !== null
            ? Math.max(0, voucherLimit - voucherSpent)
            : Infinity;

        let campaignRemaining = Infinity;
        if (voucher.campaign) {
          const campLimit =
            voucher.campaign.budgetLimit !== null
              ? Number(voucher.campaign.budgetLimit)
              : null;
          const campSpent = Number(voucher.campaign.spentAmount || 0);
          const campAllocated =
            allocatedCampaignBudgetMap.get(voucher.campaign.id) || 0;
          campaignRemaining =
            campLimit !== null
              ? Math.max(0, campLimit - campSpent - campAllocated)
              : Infinity;
        }

        const availableBudget = Math.min(voucherRemaining, campaignRemaining);

        if (availableBudget <= 0) {
          voucherError = "Mã voucher đã hết ngân sách khả dụng";
        } else {
          const rawDiscount = calculateDiscountAmount(
            subtotalAfterProductDiscount,
            voucher.discountType,
            voucher.discountValue,
            voucher.maxDiscountValue,
          );
          voucherDiscount = Math.min(rawDiscount, availableBudget);

          if (voucherDiscount > 0) {
            appliedVoucher = {
              voucherId: voucher.id,
              voucherCode: voucher.code,
              voucherName: voucher.name,
              discountAmount: voucherDiscount,
            };
          }
        }
      }
    }

    // 5. Tính tổng thanh toán cuối cùng (không có orderDiscount)
    const total = Math.max(
      0,
      totalSubtotal - totalProductDiscount - voucherDiscount,
    );

    return {
      lines: quoteLines,
      subtotal: totalSubtotal,
      productDiscount: totalProductDiscount,
      voucherDiscount,
      total,
      appliedDiscounts,
      appliedVoucher,
      voucherError,
    };
  }

  /**
   * Tính toán giá hiển thị (đã áp dụng Discount) cho danh sách variants để phục vụ catalog/chi tiết sản phẩm.
   * Không trừ ngân sách (budget) vì đây là chế độ xem catalog.
   */
  async calculateVariantsPrice<
    T extends { id: number; sellingPrice: any; listPrice?: any },
  >(
    variants: T[],
  ): Promise<
    (T & {
      discountedPrice: number;
      discountAmount: number;
      discountPercent: number;
      appliedDiscount?: {
        id: number;
        name: string;
        discountType: string;
        discountValue: any;
      };
    })[]
  > {
    if (!variants || variants.length === 0) {
      return [];
    }

    const now = new Date();

    // 1. Lấy tất cả Discount đang hoạt động (LINE scope)
    const activeDiscounts = await this.prisma.discount.findMany({
      where: {
        active: true,
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

    // Lọc ra các discount còn khả dụng về ngân sách
    const availableDiscounts = activeDiscounts.filter((disc) => {
      if (
        disc.budgetLimit !== null &&
        Number(disc.spentAmount || 0) >= Number(disc.budgetLimit)
      ) {
        return false;
      }
      if (
        disc.campaign &&
        disc.campaign.budgetLimit !== null &&
        Number(disc.campaign.spentAmount || 0) >=
          Number(disc.campaign.budgetLimit)
      ) {
        return false;
      }
      return true;
    });

    return variants.map((variant) => {
      const originalPrice = Number(variant.sellingPrice);
      const candidates: {
        discount: (typeof activeDiscounts)[0];
        group: (typeof activeDiscounts)[0]["groups"][0];
        discountAmount: number;
      }[] = [];

      for (const disc of availableDiscounts) {
        for (const group of disc.groups) {
          const matches = group.variants.some((v) => v.variantId === variant.id);
          if (matches) {
            const rawDiscount = calculateDiscountAmount(
              originalPrice,
              group.discountType,
              group.discountValue,
              group.maxDiscountValue,
            );
            if (rawDiscount > 0) {
              candidates.push({
                discount: disc,
                group,
                discountAmount: rawDiscount,
              });
            }
          }
        }
      }

      // Sắp xếp ưu tiên: priority cao hơn -> số tiền giảm lớn hơn -> discount ID nhỏ hơn
      candidates.sort((a, b) => {
        if (b.discount.priority !== a.discount.priority) {
          return b.discount.priority - a.discount.priority;
        }
        if (b.discountAmount !== a.discountAmount) {
          return b.discountAmount - a.discountAmount;
        }
        return a.discount.id - b.discount.id;
      });

      const winner = candidates[0];
      const discountAmount = winner ? winner.discountAmount : 0;
      const discountedPrice = Math.max(0, originalPrice - discountAmount);
      const discountPercent =
        originalPrice > 0
          ? Math.round((discountAmount / originalPrice) * 100)
          : 0;

      return {
        ...variant,
        discountedPrice,
        discountAmount,
        discountPercent,
        appliedDiscount: winner
          ? {
              id: winner.discount.id,
              name: winner.discount.name,
              discountType: winner.group.discountType,
              discountValue: winner.group.discountValue,
            }
          : undefined,
      };
    });
  }
}
