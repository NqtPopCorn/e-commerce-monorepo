import { api } from "@/lib/api";
import {
  AnalyticsOverviewResponse,
  AnalyticsQueryParams,
  ProductAnalyticsDetail,
  ProductPerformanceItem,
  PromotionOverviewStats,
  InventorySignalsResult,
} from "@/types/analytics";

export const analyticsService = {
  getOverview: async (
    params?: AnalyticsQueryParams,
  ): Promise<AnalyticsOverviewResponse> => {
    const res = await api.get("/admin/analytics/overview", { params });
    return res.data;
  },

  getProducts: async (
    params?: AnalyticsQueryParams,
  ): Promise<ProductPerformanceItem[]> => {
    const res = await api.get("/admin/analytics/products", { params });
    return res.data;
  },

  getProductDetail: async (
    productId: number,
    params?: AnalyticsQueryParams,
  ): Promise<ProductAnalyticsDetail> => {
    const res = await api.get(`/admin/analytics/products/${productId}`, {
      params,
    });
    return res.data;
  },

  getPromotions: async (
    params?: AnalyticsQueryParams,
  ): Promise<PromotionOverviewStats> => {
    const res = await api.get("/admin/analytics/promotions", { params });
    return res.data;
  },

  getInventory: async (
    params?: AnalyticsQueryParams,
  ): Promise<InventorySignalsResult> => {
    const res = await api.get("/admin/analytics/inventory", { params });
    return res.data;
  },
};
