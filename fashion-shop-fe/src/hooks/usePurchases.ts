import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { purchasesService } from "@/services/purchases.service";
import { CreatePurchaseDto, PurchasesQuery } from "@/types/purchase";

export const useGetPurchases = (query?: PurchasesQuery) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-purchases", query],
    queryFn: () => purchasesService.getAll(query),
    enabled: !!token,
  });
};

export const useGetPurchaseStats = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-purchases-stats"],
    queryFn: purchasesService.getStats,
    enabled: !!token,
  });
};

export const useGetPurchase = (id: number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-purchases", id],
    queryFn: () => purchasesService.getById(id),
    enabled: !!token && !!id,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseDto) => purchasesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["admin-purchases-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stock"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
