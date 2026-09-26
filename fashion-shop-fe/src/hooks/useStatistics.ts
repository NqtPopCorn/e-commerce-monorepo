import { useQuery } from "@tanstack/react-query";
import { statisticsService } from "@/services/statistics.service";
import { useAuthStore } from "@/stores/auth.store";

export const useGetOverviewStats = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["admin-statistics"],
    queryFn: statisticsService.getOverview,
    enabled: !!token && user?.role === "ADMIN",
  });
};

export const useGetRevenueStats = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-revenue"],
    queryFn: statisticsService.getRevenue,
    enabled: !!token,
  });
};

export const useGetStockStats = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-stock"],
    queryFn: statisticsService.getStock,
    enabled: !!token,
  });
};
