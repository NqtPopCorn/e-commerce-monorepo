export interface AnalyticsQueryParams {
  from?: string;
  to?: string;
  compare?: boolean;
  categoryId?: number;
  brandId?: number;
  productId?: number;
  campaignId?: number;
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface KpiMetric {
  value: number;
  previousValue: number;
  deltaPercent: number;
  isPositive: boolean;
  sparkline: SparklinePoint[];
}

export interface SalesTimelinePoint {
  date: string;
  revenue: number;
  orders: number;
  units: number;
  prevRevenue?: number;
  prevOrders?: number;
  prevUnits?: number;
}

export interface ProductPerformanceItem {
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
  trendPercent: number;
  isPositiveTrend: boolean;
  currentStock: number;
}

export interface PromotionGroupItem {
  id: string;
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

export interface CategoryPerformanceItem {
  name: string;
  revenue: number;
  unitsSold: number;
  percentage: number;
}

export interface CriticalSkuItem {
  id: number;
  sku: string;
  productName: string;
  size?: string;
  color?: string;
  stock: number;
  sellingPrice: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK" | "SLOW_MOVING";
  unitsSoldInPeriod: number;
}

export interface InventorySignalsResult {
  outOfStockCount: number;
  lowStockCount: number;
  slowMovingCount: number;
  criticalSkus: CriticalSkuItem[];
}

export interface BusinessInsightItem {
  id: string;
  type: "REVENUE_DROP" | "STOCKOUT_ALERT" | "HIGH_DISCOUNT" | "BUDGET_EXHAUSTION" | "POSITIVE_GROWTH";
  title: string;
  message: string;
  severity: "alert" | "warning" | "info" | "positive";
  ctaText?: string;
  ctaLink?: string;
  evidence: string[];
}

export interface AnalyticsOverviewResponse {
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  kpis: {
    netSales: KpiMetric;
    orders: KpiMetric;
    unitsSold: KpiMetric;
    aov: KpiMetric;
  };
  salesTrend: SalesTimelinePoint[];
  productPerformance: ProductPerformanceItem[];
  promotionPerformance: PromotionOverviewStats;
  categoryPerformance: CategoryPerformanceItem[];
  inventorySignals: InventorySignalsResult;
  insights: BusinessInsightItem[];
}

export interface VariantDetailStat {
  id: number;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  sellingPrice: number;
  revenue: number;
  unitsSold: number;
}

export interface ProductAnalyticsDetail {
  productId: number;
  productName: string;
  totalRevenue: number;
  totalUnits: number;
  variants: VariantDetailStat[];
}
