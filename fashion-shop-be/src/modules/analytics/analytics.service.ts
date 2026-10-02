import { Injectable, NotFoundException } from "@nestjs/common";
import { AnalyticsRepository, DateFilter, DimensionFilters } from "./analytics.repository";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { SalesCalculator } from "./calculators/sales.calculator";
import { ProductCalculator, ProductPerformanceItem } from "./calculators/product.calculator";
import { PromotionCalculator } from "./calculators/promotion.calculator";
import { InventoryCalculator } from "./calculators/inventory.calculator";
import { InsightsEngine } from "./calculators/insights.engine";

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  /**
   * Chuẩn hóa khoảng thời gian tìm kiếm từ Query
   */
  private resolveDateRanges(query: AnalyticsQueryDto): {
    current: DateFilter;
    previous: DateFilter;
  } {
    const to = query.to ? new Date(query.to) : new Date();
    // Mặc định: 30 ngày trước
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const duration = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(from.getTime() - duration);

    return {
      current: { from, to },
      previous: { from: prevFrom, to: prevTo },
    };
  }

  /**
   * Tạo các bucket theo ngày (YYYY-MM-DD)
   */
  private createDailyBuckets(from: Date, to: Date) {
    const buckets = new Map<string, { revenue: number; orders: number; units: number }>();
    const curr = new Date(from);
    while (curr <= to) {
      const key = curr.toISOString().split("T")[0];
      buckets.set(key, { revenue: 0, orders: 0, units: 0 });
      curr.setDate(curr.getDate() + 1);
    }
    return buckets;
  }

  /**
   * Endpoint chính: Overview Workspace
   */
  async getOverview(query: AnalyticsQueryDto) {
    const { current, previous } = this.resolveDateRanges(query);
    const filters: DimensionFilters = {
      categoryId: query.categoryId,
      brandId: query.brandId,
      productId: query.productId,
      campaignId: query.campaignId,
    };

    // 1. Tải song song dữ liệu tổng hợp
    const [
      currentSummary,
      prevSummary,
      currentOrders,
      prevOrders,
      currentItems,
      prevItems,
      promoData,
      allVariants,
      categories,
    ] = await Promise.all([
      this.repository.getOrderSummary(current, filters),
      this.repository.getOrderSummary(previous, filters),
      this.repository.getOrders(current, filters),
      this.repository.getOrders(previous, filters),
      this.repository.getOrderItems(current, filters),
      this.repository.getOrderItems(previous, filters),
      this.repository.getPromotionApplications(current),
      this.repository.getAllVariants(),
      this.repository.getCategories(),
    ]);

    // 2. Xây dựng Timeline theo ngày
    const currentBuckets = this.createDailyBuckets(current.from, current.to);
    currentOrders.forEach((o) => {
      const dateKey = o.createdAt.toISOString().split("T")[0];
      const bucket = currentBuckets.get(dateKey);
      if (bucket) {
        bucket.revenue += Number(o.total);
        bucket.orders += 1;
      }
    });

    currentItems.forEach((item) => {
      // Find item date through its order
      const order = currentOrders.find((o) => o.id === item.orderId);
      if (order) {
        const dateKey = order.createdAt.toISOString().split("T")[0];
        const bucket = currentBuckets.get(dateKey);
        if (bucket) {
          bucket.units += item.quantity;
        }
      }
    });

    const prevBuckets = this.createDailyBuckets(previous.from, previous.to);
    prevOrders.forEach((o) => {
      const dateKey = o.createdAt.toISOString().split("T")[0];
      const bucket = prevBuckets.get(dateKey);
      if (bucket) {
        bucket.revenue += Number(o.total);
        bucket.orders += 1;
      }
    });

    prevItems.forEach((item) => {
      const order = prevOrders.find((o) => o.id === item.orderId);
      if (order) {
        const dateKey = order.createdAt.toISOString().split("T")[0];
        const bucket = prevBuckets.get(dateKey);
        if (bucket) {
          bucket.units += item.quantity;
        }
      }
    });

    const currentTimelinePoints = Array.from(currentBuckets.entries()).map(
      ([date, stats]) => ({
        date,
        ...stats,
      }),
    );

    const prevTimelinePoints = Array.from(prevBuckets.entries()).map(
      ([date, stats]) => ({
        date,
        ...stats,
      }),
    );

    const salesTrend = SalesCalculator.mergeTimelines(
      currentTimelinePoints,
      prevTimelinePoints,
    );

    // 3. Tính toán các thẻ KPIs
    const totalCurrentUnits = currentItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrevUnits = prevItems.reduce((sum, item) => sum + item.quantity, 0);

    const kpis = SalesCalculator.computeKpiMetrics({
      currentSales: currentSummary.netSales,
      previousSales: prevSummary.netSales,
      currentOrders: currentSummary.ordersCount,
      previousOrders: prevSummary.ordersCount,
      currentUnits: totalCurrentUnits,
      previousUnits: totalPrevUnits,
      currentTimeline: currentTimelinePoints,
    });

    // 4. Tính toán Hiệu suất sản phẩm (Product Performance)
    const currentProductMap = new Map<
      number,
      {
        id: number;
        name: string;
        slug: string;
        categoryName: string;
        brandName?: string;
        imageUrl?: string;
        revenue: number;
        unitsSold: number;
        ordersCount: number;
        discountAmount: number;
        currentStock: number;
      }
    >();

    const prodOrdersMap = new Map<number, Set<number>>();

    currentItems.forEach((item) => {
      const prod = item.variant.product;
      if (!currentProductMap.has(prod.id)) {
        currentProductMap.set(prod.id, {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          categoryName: prod.category?.name || "Khác",
          brandName: prod.brand?.name,
          imageUrl: prod.images[0]?.url,
          revenue: 0,
          unitsSold: 0,
          ordersCount: 0,
          discountAmount: 0,
          currentStock: 0,
        });
        prodOrdersMap.set(prod.id, new Set());
      }

      const pEntry = currentProductMap.get(prod.id)!;
      pEntry.revenue += Number(item.finalUnitPrice) * item.quantity;
      pEntry.unitsSold += item.quantity;
      pEntry.discountAmount += Number(item.productDiscount) * item.quantity;
      pEntry.currentStock += item.variant.stock;
      prodOrdersMap.get(prod.id)!.add(item.orderId);
    });

    currentProductMap.forEach((entry, prodId) => {
      entry.ordersCount = prodOrdersMap.get(prodId)?.size || 0;
    });

    const prevProductMap = new Map<number, { revenue: number }>();
    prevItems.forEach((item) => {
      const prodId = item.variant.product.id;
      const prevEntry = prevProductMap.get(prodId) || { revenue: 0 };
      prevEntry.revenue += Number(item.finalUnitPrice) * item.quantity;
      prevProductMap.set(prodId, prevEntry);
    });

    const fullProductPerformance = ProductCalculator.computeProductPerformance({
      currentProducts: currentProductMap,
      previousProducts: prevProductMap,
    });

    // Top 5 sản phẩm cho Overview
    const productPerformance = fullProductPerformance.slice(0, 5);

    // 5. Tính toán Khuyến mãi (Promotion Performance)
    const formattedDiscounts = promoData.discountApps.map((d) => ({
      discountId: d.discountId,
      discountName: d.discountName,
      discountAmount: Number(d.discountAmount),
      orderId: d.orderId,
      orderTotal: Number(d.order.total),
      campaignId: d.discount.campaignId,
      campaignName: d.discount.campaign?.name,
    }));

    const formattedVouchers = promoData.voucherApps.map((v) => ({
      voucherId: v.voucherId,
      voucherName: v.voucherName,
      voucherCode: v.voucherCode,
      discountAmount: Number(v.discountAmount),
      orderId: v.orderId,
      orderTotal: Number(v.order.total),
      campaignId: v.voucher.campaignId,
      campaignName: v.voucher.campaign?.name,
    }));

    const promotionPerformance = PromotionCalculator.computePromotionStats({
      discountApplications: formattedDiscounts,
      voucherApplications: formattedVouchers,
      campaigns: promoData.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
        spentAmount: Number(c.spentAmount),
      })),
    });

    // 6. Tính toán Tín hiệu kho (Inventory Signals)
    const variantSalesMap = new Map<number, number>();
    currentItems.forEach((item) => {
      const count = variantSalesMap.get(item.variantId) || 0;
      variantSalesMap.set(item.variantId, count + item.quantity);
    });

    const inventorySignals = InventoryCalculator.computeSignals({
      variants: allVariants.map((v) => ({
        id: v.id,
        sku: v.sku,
        stock: v.stock,
        sellingPrice: Number(v.sellingPrice),
        size: v.size,
        color: v.color,
        product: v.product,
      })),
      variantSalesMap,
    });

    // 7. Cơ cấu doanh số theo Danh mục (Category Performance)
    const categorySalesMap = new Map<string, { revenue: number; unitsSold: number }>();
    categories.forEach((cat) => {
      categorySalesMap.set(cat.name, { revenue: 0, unitsSold: 0 });
    });

    currentItems.forEach((item) => {
      const catName = item.variant.product.category?.name || "Khác";
      const catData = categorySalesMap.get(catName) || { revenue: 0, unitsSold: 0 };
      catData.revenue += Number(item.finalUnitPrice) * item.quantity;
      catData.unitsSold += item.quantity;
      categorySalesMap.set(catName, catData);
    });

    const totalCategoryRevenue = Array.from(categorySalesMap.values()).reduce(
      (sum, c) => sum + c.revenue,
      0,
    );

    const categoryPerformance = Array.from(categorySalesMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        unitsSold: data.unitsSold,
        percentage:
          totalCategoryRevenue > 0
            ? Number(((data.revenue / totalCategoryRevenue) * 100).toFixed(1))
            : 0,
      }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // 8. Động cơ cảnh báo Business Insights
    const insights = InsightsEngine.evaluateInsights({
      salesDeltaPercent: kpis.netSales.deltaPercent,
      currentSales: currentSummary.netSales,
      previousSales: prevSummary.netSales,
      grossSales: currentSummary.grossSales,
      discountCost: currentSummary.discountCost,
      productPerformance: fullProductPerformance,
      previousProductMap: prevProductMap,
      criticalSkus: inventorySignals.criticalSkus,
      campaigns: promoData.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
        spentAmount: Number(c.spentAmount),
      })),
    });

    return {
      period: {
        from: current.from.toISOString(),
        to: current.to.toISOString(),
        previousFrom: previous.from.toISOString(),
        previousTo: previous.to.toISOString(),
      },
      kpis,
      salesTrend,
      productPerformance,
      promotionPerformance,
      categoryPerformance,
      inventorySignals,
      insights,
    };
  }

  /**
   * API Sub-resource: Danh sách đầy đủ hiệu suất sản phẩm
   */
  async getProducts(query: AnalyticsQueryDto) {
    const { current, previous } = this.resolveDateRanges(query);
    const filters: DimensionFilters = {
      categoryId: query.categoryId,
      brandId: query.brandId,
      productId: query.productId,
    };

    const [currentItems, prevItems] = await Promise.all([
      this.repository.getOrderItems(current, filters),
      this.repository.getOrderItems(previous, filters),
    ]);

    const currentProductMap = new Map<
      number,
      {
        id: number;
        name: string;
        slug: string;
        categoryName: string;
        brandName?: string;
        imageUrl?: string;
        revenue: number;
        unitsSold: number;
        ordersCount: number;
        discountAmount: number;
        currentStock: number;
      }
    >();

    const prodOrdersMap = new Map<number, Set<number>>();

    currentItems.forEach((item) => {
      const prod = item.variant.product;
      if (!currentProductMap.has(prod.id)) {
        currentProductMap.set(prod.id, {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          categoryName: prod.category?.name || "Khác",
          brandName: prod.brand?.name,
          imageUrl: prod.images[0]?.url,
          revenue: 0,
          unitsSold: 0,
          ordersCount: 0,
          discountAmount: 0,
          currentStock: 0,
        });
        prodOrdersMap.set(prod.id, new Set());
      }

      const pEntry = currentProductMap.get(prod.id)!;
      pEntry.revenue += Number(item.finalUnitPrice) * item.quantity;
      pEntry.unitsSold += item.quantity;
      pEntry.discountAmount += Number(item.productDiscount) * item.quantity;
      pEntry.currentStock += item.variant.stock;
      prodOrdersMap.get(prod.id)!.add(item.orderId);
    });

    currentProductMap.forEach((entry, prodId) => {
      entry.ordersCount = prodOrdersMap.get(prodId)?.size || 0;
    });

    const prevProductMap = new Map<number, { revenue: number }>();
    prevItems.forEach((item) => {
      const prodId = item.variant.product.id;
      const prevEntry = prevProductMap.get(prodId) || { revenue: 0 };
      prevEntry.revenue += Number(item.finalUnitPrice) * item.quantity;
      prevProductMap.set(prodId, prevEntry);
    });

    return ProductCalculator.computeProductPerformance({
      currentProducts: currentProductMap,
      previousProducts: prevProductMap,
    });
  }

  /**
   * API Sub-resource: Chi tiết hiệu suất 1 sản phẩm (cho Quick Drawer hoặc trang riêng)
   */
  async getProductDetail(productId: number, query: AnalyticsQueryDto) {
    const { current } = this.resolveDateRanges(query);
    const items = await this.repository.getOrderItems(current, { productId });

    if (items.length === 0) {
      // Kiểm tra sản phẩm có tồn tại trong DB không
      return {
        productId,
        totalRevenue: 0,
        totalUnits: 0,
        variants: [],
      };
    }

    const variantMap = new Map<
      number,
      {
        id: number;
        sku: string;
        size?: string;
        color?: string;
        stock: number;
        sellingPrice: number;
        revenue: number;
        unitsSold: number;
      }
    >();

    let totalRevenue = 0;
    let totalUnits = 0;

    items.forEach((item) => {
      const v = item.variant;
      if (!variantMap.has(v.id)) {
        variantMap.set(v.id, {
          id: v.id,
          sku: v.sku,
          size: v.size || undefined,
          color: v.color || undefined,
          stock: v.stock,
          sellingPrice: Number(v.sellingPrice),
          revenue: 0,
          unitsSold: 0,
        });
      }

      const vEntry = variantMap.get(v.id)!;
      const rev = Number(item.finalUnitPrice) * item.quantity;
      vEntry.revenue += rev;
      vEntry.unitsSold += item.quantity;
      totalRevenue += rev;
      totalUnits += item.quantity;
    });

    return {
      productId,
      productName: items[0].variant.product.name,
      totalRevenue,
      totalUnits,
      variants: Array.from(variantMap.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  /**
   * API Sub-resource: Khuyến mãi & Chiến dịch
   */
  async getPromotions(query: AnalyticsQueryDto) {
    const { current } = this.resolveDateRanges(query);
    const promoData = await this.repository.getPromotionApplications(current);

    const formattedDiscounts = promoData.discountApps.map((d) => ({
      discountId: d.discountId,
      discountName: d.discountName,
      discountAmount: Number(d.discountAmount),
      orderId: d.orderId,
      orderTotal: Number(d.order.total),
      campaignId: d.discount.campaignId,
      campaignName: d.discount.campaign?.name,
    }));

    const formattedVouchers = promoData.voucherApps.map((v) => ({
      voucherId: v.voucherId,
      voucherName: v.voucherName,
      voucherCode: v.voucherCode,
      discountAmount: Number(v.discountAmount),
      orderId: v.orderId,
      orderTotal: Number(v.order.total),
      campaignId: v.voucher.campaignId,
      campaignName: v.voucher.campaign?.name,
    }));

    return PromotionCalculator.computePromotionStats({
      discountApplications: formattedDiscounts,
      voucherApplications: formattedVouchers,
      campaigns: promoData.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
        spentAmount: Number(c.spentAmount),
      })),
    });
  }

  /**
   * API Sub-resource: Sức khỏe tồn kho (Inventory)
   */
  async getInventory(query: AnalyticsQueryDto) {
    const { current } = this.resolveDateRanges(query);
    const [allVariants, currentItems] = await Promise.all([
      this.repository.getAllVariants(),
      this.repository.getOrderItems(current),
    ]);

    const variantSalesMap = new Map<number, number>();
    currentItems.forEach((item) => {
      const count = variantSalesMap.get(item.variantId) || 0;
      variantSalesMap.set(item.variantId, count + item.quantity);
    });

    return InventoryCalculator.computeSignals({
      variants: allVariants.map((v) => ({
        id: v.id,
        sku: v.sku,
        stock: v.stock,
        sellingPrice: Number(v.sellingPrice),
        size: v.size,
        color: v.color,
        product: v.product,
      })),
      variantSalesMap,
    });
  }

  /**
   * API Sub-resource: Thống kê khách hàng (Customers)
   */
  async getCustomers(query: AnalyticsQueryDto) {
    const tiers = await this.repository.getCustomerTiers();
    return {
      tiers: tiers.map((t) => ({
        tier: t.tier,
        count: t._count.id,
      })),
    };
  }
}
