import { SalesCalculator } from "./calculators/sales.calculator";
import { InsightsEngine } from "./calculators/insights.engine";
import { PromotionCalculator } from "./calculators/promotion.calculator";
import { ProductCalculator } from "./calculators/product.calculator";

describe("Analytics Calculators & Rules", () => {
  describe("SalesCalculator", () => {
    it("should calculate delta percentage correctly", () => {
      expect(SalesCalculator.calculateDelta(120, 100)).toBe(20);
      expect(SalesCalculator.calculateDelta(80, 100)).toBe(-20);
      expect(SalesCalculator.calculateDelta(100, 0)).toBe(100);
      expect(SalesCalculator.calculateDelta(0, 0)).toBe(0);
    });

    it("should compute KPI metrics with sparklines and AOV", () => {
      const kpis = SalesCalculator.computeKpiMetrics({
        currentSales: 1000000,
        previousSales: 800000,
        currentOrders: 10,
        previousOrders: 8,
        currentUnits: 25,
        previousUnits: 20,
        currentTimeline: [
          { date: "2026-09-01", revenue: 500000, orders: 5, units: 12 },
          { date: "2026-09-02", revenue: 500000, orders: 5, units: 13 },
        ],
      });

      expect(kpis.netSales.value).toBe(1000000);
      expect(kpis.netSales.deltaPercent).toBe(25);
      expect(kpis.netSales.isPositive).toBe(true);

      expect(kpis.orders.value).toBe(10);
      expect(kpis.orders.deltaPercent).toBe(25);

      expect(kpis.aov.value).toBe(100000);
      expect(kpis.aov.previousValue).toBe(100000);
      expect(kpis.aov.deltaPercent).toBe(0);
    });
  });

  describe("ProductCalculator", () => {
    it("should calculate product performance and trend vs previous period", () => {
      const currentProducts = new Map([
        [
          1,
          {
            id: 1,
            name: "Áo Thun Classic",
            slug: "ao-thun-classic",
            categoryName: "Áo thun",
            revenue: 200000,
            unitsSold: 2,
            ordersCount: 2,
            discountAmount: 20000,
            currentStock: 15,
          },
        ],
      ]);

      const previousProducts = new Map([[1, { revenue: 100000 }]]);

      const results = ProductCalculator.computeProductPerformance({
        currentProducts,
        previousProducts,
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Áo Thun Classic");
      expect(results[0].trendPercent).toBe(100);
      expect(results[0].isPositiveTrend).toBe(true);
    });
  });

  describe("PromotionCalculator", () => {
    it("should group discounts and vouchers by campaign correctly", () => {
      const stats = PromotionCalculator.computePromotionStats({
        discountApplications: [
          {
            discountId: 1,
            discountName: "Sale 10%",
            discountAmount: 20000,
            orderId: 101,
            orderTotal: 180000,
            campaignId: 5,
            campaignName: "Chiến dịch Hè",
          },
        ],
        voucherApplications: [
          {
            voucherId: 2,
            voucherName: "Voucher 50k",
            voucherCode: "HE2026",
            discountAmount: 50000,
            orderId: 101,
            orderTotal: 180000,
            campaignId: 5,
            campaignName: "Chiến dịch Hè",
          },
        ],
        campaigns: [
          {
            id: 5,
            name: "Chiến dịch Hè",
            budgetLimit: 10000000,
            spentAmount: 70000,
          },
        ],
      });

      expect(stats.totalDiscountCost).toBe(70000);
      expect(stats.promotionOrdersCount).toBe(1);
      expect(stats.topPromotions).toHaveLength(1);
      expect(stats.topPromotions[0].name).toBe("Chiến dịch Hè");
      expect(stats.topPromotions[0].type).toBe("CAMPAIGN");
      expect(stats.topPromotions[0].discountCost).toBe(70000);
      expect(stats.topPromotions[0].subItems).toHaveLength(2);
    });
  });

  describe("InsightsEngine", () => {
    it("should trigger revenue drop alert when drop >= 15%", () => {
      const insights = InsightsEngine.evaluateInsights({
        salesDeltaPercent: -20,
        currentSales: 800000,
        previousSales: 1000000,
        grossSales: 900000,
        discountCost: 100000,
        productPerformance: [
          { id: 1, name: "Áo Sơ Mi", revenue: 200000, trendPercent: -50 },
        ],
        previousProductMap: new Map([[1, { revenue: 400000 }]]),
        criticalSkus: [],
        campaigns: [],
      });

      const dropAlert = insights.find((i) => i.type === "REVENUE_DROP");
      expect(dropAlert).toBeDefined();
      expect(dropAlert?.severity).toBe("alert");
      expect(dropAlert?.evidence.some((e) => e.includes("Áo Sơ Mi"))).toBe(true);
    });

    it("should trigger stockout alert for hot-selling out of stock items", () => {
      const insights = InsightsEngine.evaluateInsights({
        salesDeltaPercent: 5,
        currentSales: 1000000,
        previousSales: 950000,
        grossSales: 1000000,
        discountCost: 0,
        productPerformance: [],
        previousProductMap: new Map(),
        criticalSkus: [
          {
            id: 99,
            sku: "ASM-WHT-L",
            productName: "Áo Sơ Mi Trắng L",
            stock: 0,
            unitsSoldInPeriod: 5,
          },
        ],
        campaigns: [],
      });

      const stockoutAlert = insights.find((i) => i.type === "STOCKOUT_ALERT");
      expect(stockoutAlert).toBeDefined();
      expect(stockoutAlert?.severity).toBe("alert");
    });
  });
});
