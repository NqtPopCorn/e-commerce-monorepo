export interface PromotionGroupItem {
  id: string; // "camp-{id}" hoặc "disc-{id}" hoặc "vouch-{id}"
  type: "CAMPAIGN" | "DISCOUNT" | "VOUCHER";
  name: string;
  campaignName?: string;
  revenue: number;
  ordersCount: number;
  discountCost: number;
  budgetLimit?: number;
  spentAmount?: number;
  subItems?: {
    name: string;
    type: "DISCOUNT" | "VOUCHER";
    revenue: number;
    discountCost: number;
    ordersCount: number;
  }[];
}

export interface PromotionOverviewStats {
  discountRevenue: number;
  voucherRevenue: number;
  totalDiscountCost: number;
  promotionOrdersCount: number;
  topPromotions: PromotionGroupItem[];
}

export class PromotionCalculator {
  static computePromotionStats(params: {
    discountApplications: {
      discountId: number;
      discountName: string;
      discountAmount: number;
      orderId: number;
      orderTotal: number;
      campaignId?: number | null;
      campaignName?: string | null;
    }[];
    voucherApplications: {
      voucherId: number;
      voucherName: string;
      voucherCode: string;
      discountAmount: number;
      orderId: number;
      orderTotal: number;
      campaignId?: number | null;
      campaignName?: string | null;
    }[];
    campaigns: {
      id: number;
      name: string;
      budgetLimit: number | null;
      spentAmount: number;
    }[];
  }): PromotionOverviewStats {
    let totalDiscountCost = 0;
    const discountOrderIds = new Set<number>();
    const voucherOrderIds = new Set<number>();
    const allPromoOrderIds = new Set<number>();

    // Tính tổng chi phí và tập hợp Order
    params.discountApplications.forEach((d) => {
      totalDiscountCost += d.discountAmount;
      discountOrderIds.add(d.orderId);
      allPromoOrderIds.add(d.orderId);
    });

    params.voucherApplications.forEach((v) => {
      totalDiscountCost += v.discountAmount;
      voucherOrderIds.add(v.orderId);
      allPromoOrderIds.add(v.orderId);
    });

    // Gom nhóm theo Campaign
    const campaignMap = new Map<
      number,
      {
        id: number;
        name: string;
        revenueOrders: Map<number, number>; // orderId -> total
        discountCost: number;
        subItems: Map<
          string,
          {
            name: string;
            type: "DISCOUNT" | "VOUCHER";
            orders: Map<number, number>;
            discountCost: number;
          }
        >;
      }
    >();

    // Khởi tạo các campaign hiện có
    params.campaigns.forEach((c) => {
      campaignMap.set(c.id, {
        id: c.id,
        name: c.name,
        revenueOrders: new Map(),
        discountCost: 0,
        subItems: new Map(),
      });
    });

    // Các Discount độc lập không thuộc Campaign
    const directDiscounts = new Map<
      number,
      {
        name: string;
        orders: Map<number, number>;
        discountCost: number;
      }
    >();

    // Các Voucher độc lập không thuộc Campaign
    const directVouchers = new Map<
      number,
      {
        name: string;
        orders: Map<number, number>;
        discountCost: number;
      }
    >();

    // Xử lý Discount Applications
    params.discountApplications.forEach((d) => {
      if (d.campaignId && campaignMap.has(d.campaignId)) {
        const camp = campaignMap.get(d.campaignId)!;
        camp.revenueOrders.set(d.orderId, d.orderTotal);
        camp.discountCost += d.discountAmount;

        const subKey = `disc-${d.discountId}`;
        if (!camp.subItems.has(subKey)) {
          camp.subItems.set(subKey, {
            name: d.discountName,
            type: "DISCOUNT",
            orders: new Map(),
            discountCost: 0,
          });
        }
        const sub = camp.subItems.get(subKey)!;
        sub.orders.set(d.orderId, d.orderTotal);
        sub.discountCost += d.discountAmount;
      } else {
        if (!directDiscounts.has(d.discountId)) {
          directDiscounts.set(d.discountId, {
            name: d.discountName,
            orders: new Map(),
            discountCost: 0,
          });
        }
        const item = directDiscounts.get(d.discountId)!;
        item.orders.set(d.orderId, d.orderTotal);
        item.discountCost += d.discountAmount;
      }
    });

    // Xử lý Voucher Applications
    params.voucherApplications.forEach((v) => {
      if (v.campaignId && campaignMap.has(v.campaignId)) {
        const camp = campaignMap.get(v.campaignId)!;
        camp.revenueOrders.set(v.orderId, v.orderTotal);
        camp.discountCost += v.discountAmount;

        const subKey = `vouch-${v.voucherId}`;
        if (!camp.subItems.has(subKey)) {
          camp.subItems.set(subKey, {
            name: `${v.voucherName} (${v.voucherCode})`,
            type: "VOUCHER",
            orders: new Map(),
            discountCost: 0,
          });
        }
        const sub = camp.subItems.get(subKey)!;
        sub.orders.set(v.orderId, v.orderTotal);
        sub.discountCost += v.discountAmount;
      } else {
        if (!directVouchers.has(v.voucherId)) {
          directVouchers.set(v.voucherId, {
            name: `${v.voucherName} (${v.voucherCode})`,
            orders: new Map(),
            discountCost: 0,
          });
        }
        const item = directVouchers.get(v.voucherId)!;
        item.orders.set(v.orderId, v.orderTotal);
        item.discountCost += v.discountAmount;
      }
    });

    // Chuyển đổi sang mảng PromotionGroupItem
    const topPromotions: PromotionGroupItem[] = [];

    campaignMap.forEach((camp) => {
      const campRevenue = Array.from(camp.revenueOrders.values()).reduce(
        (sum, t) => sum + t,
        0,
      );
      if (camp.discountCost > 0 || campRevenue > 0) {
        const rawCamp = params.campaigns.find((c) => c.id === camp.id);
        const subItemsList = Array.from(camp.subItems.values()).map((sub) => ({
          name: sub.name,
          type: sub.type,
          revenue: Array.from(sub.orders.values()).reduce((sum, t) => sum + t, 0),
          discountCost: sub.discountCost,
          ordersCount: sub.orders.size,
        }));

        topPromotions.push({
          id: `camp-${camp.id}`,
          type: "CAMPAIGN",
          name: camp.name,
          revenue: campRevenue,
          ordersCount: camp.revenueOrders.size,
          discountCost: camp.discountCost,
          budgetLimit: rawCamp?.budgetLimit ? Number(rawCamp.budgetLimit) : undefined,
          spentAmount: rawCamp ? Number(rawCamp.spentAmount) : 0,
          subItems: subItemsList,
        });
      }
    });

    directDiscounts.forEach((item, discId) => {
      const revenue = Array.from(item.orders.values()).reduce((sum, t) => sum + t, 0);
      topPromotions.push({
        id: `disc-${discId}`,
        type: "DISCOUNT",
        name: item.name,
        revenue,
        ordersCount: item.orders.size,
        discountCost: item.discountCost,
      });
    });

    directVouchers.forEach((item, vouchId) => {
      const revenue = Array.from(item.orders.values()).reduce((sum, t) => sum + t, 0);
      topPromotions.push({
        id: `vouch-${vouchId}`,
        type: "VOUCHER",
        name: item.name,
        revenue,
        ordersCount: item.orders.size,
        discountCost: item.discountCost,
      });
    });

    // Sắp xếp theo doanh thu giảm dần
    topPromotions.sort((a, b) => b.revenue - a.revenue);

    // Tính tổng doanh thu gắn với discount và voucher
    let discountRevenue = 0;
    const processedDiscountOrders = new Set<number>();
    params.discountApplications.forEach((d) => {
      if (!processedDiscountOrders.has(d.orderId)) {
        discountRevenue += d.orderTotal;
        processedDiscountOrders.add(d.orderId);
      }
    });

    let voucherRevenue = 0;
    const processedVoucherOrders = new Set<number>();
    params.voucherApplications.forEach((v) => {
      if (!processedVoucherOrders.has(v.orderId)) {
        voucherRevenue += v.orderTotal;
        processedVoucherOrders.add(v.orderId);
      }
    });

    return {
      discountRevenue,
      voucherRevenue,
      totalDiscountCost,
      promotionOrdersCount: allPromoOrderIds.size,
      topPromotions,
    };
  }
}
