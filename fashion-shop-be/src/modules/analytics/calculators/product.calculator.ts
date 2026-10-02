import { SalesCalculator } from "./sales.calculator";

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
  trendPercent: number; // So với kỳ trước
  isPositiveTrend: boolean;
  currentStock: number;
}

export class ProductCalculator {
  static computeProductPerformance(params: {
    currentProducts: Map<
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
    >;
    previousProducts: Map<number, { revenue: number }>;
  }): ProductPerformanceItem[] {
    const results: ProductPerformanceItem[] = [];

    params.currentProducts.forEach((item, productId) => {
      const prev = params.previousProducts.get(productId);
      const prevRevenue = prev ? prev.revenue : 0;
      const trendPercent = SalesCalculator.calculateDelta(item.revenue, prevRevenue);

      results.push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        categoryName: item.categoryName,
        brandName: item.brandName,
        imageUrl: item.imageUrl,
        revenue: item.revenue,
        unitsSold: item.unitsSold,
        ordersCount: item.ordersCount,
        discountAmount: item.discountAmount,
        trendPercent,
        isPositiveTrend: trendPercent >= 0,
        currentStock: item.currentStock,
      });
    });

    // Sắp xếp giảm dần theo doanh thu
    return results.sort((a, b) => b.revenue - a.revenue);
  }
}
