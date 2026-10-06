import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";
import { AnalyticsQueryParams } from "@/types/analytics";
import { useAuthStore } from "@/stores/auth.store";

export const useAnalyticsOverview = (params?: AnalyticsQueryParams) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["admin-analytics-overview", params],
    queryFn: () => analyticsService.getOverview(params),
    enabled: !!token && user?.role === "ADMIN",
    staleTime: 60 * 1000, // 1 phút
    refetchOnWindowFocus: false,
  });
};

export const useProductAnalyticsList = (params?: AnalyticsQueryParams) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["admin-analytics-products", params],
    queryFn: () => analyticsService.getProducts(params),
    enabled: !!token && user?.role === "ADMIN",
    staleTime: 60 * 1000,
  });
};

export const useProductAnalyticsDetail = (
  productId?: number,
  params?: AnalyticsQueryParams,
) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-analytics-product-detail", productId, params],
    queryFn: () => analyticsService.getProductDetail(productId!, params),
    enabled: !!token && !!productId,
  });
};

export const usePromotionAnalytics = (params?: AnalyticsQueryParams) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-analytics-promotions", params],
    queryFn: () => analyticsService.getPromotions(params),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};

export const useInventoryAnalytics = (params?: AnalyticsQueryParams) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["admin-analytics-inventory", params],
    queryFn: () => analyticsService.getInventory(params),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};
