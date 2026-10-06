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

export class InventoryCalculator {
  static computeSignals(params: {
    variants: {
      id: number;
      sku: string;
      stock: number;
      sellingPrice: number;
      size: string | null;
      color: string | null;
      product: {
        id: number;
        name: string;
      };
    }[];
    variantSalesMap: Map<number, number>; // variantId -> unitsSold in period
  }): InventorySignalsResult {
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let slowMovingCount = 0;

    const criticalSkus: CriticalSkuItem[] = [];

    params.variants.forEach((v) => {
      const sold = params.variantSalesMap.get(v.id) || 0;

      if (v.stock === 0) {
        outOfStockCount++;
        criticalSkus.push({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
          size: v.size || undefined,
          color: v.color || undefined,
          stock: v.stock,
          sellingPrice: Number(v.sellingPrice),
          status: "OUT_OF_STOCK",
          unitsSoldInPeriod: sold,
        });
      } else if (v.stock <= 5) {
        lowStockCount++;
        criticalSkus.push({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
          size: v.size || undefined,
          color: v.color || undefined,
          stock: v.stock,
          sellingPrice: Number(v.sellingPrice),
          status: "LOW_STOCK",
          unitsSoldInPeriod: sold,
        });
      } else if (v.stock >= 10 && sold <= 1) {
        slowMovingCount++;
      }
    });

    // Ưu tiên hiển thị: Hết hàng trước, sau đó sắp hết hàng
    criticalSkus.sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return -1;
      if (a.stock > 0 && b.stock === 0) return 1;
      return a.stock - b.stock;
    });

    return {
      outOfStockCount,
      lowStockCount,
      slowMovingCount,
      criticalSkus: criticalSkus.slice(0, 10), // Giới hạn 10 SKU nguy cấp nhất
    };
  }
}
