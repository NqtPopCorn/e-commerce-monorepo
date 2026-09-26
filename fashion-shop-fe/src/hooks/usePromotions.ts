import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionsService } from "@/services/promotions.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  CartInput,
  CreatePromotionDto,
  PromotionQuery,
  UpdatePromotionDto,
} from "@/types/promotion";

export const usePromotionQuote = (items: CartInput[], voucherCode?: string) => {
  const token = useAuthStore((state) => state.token);
  const normalizedItems = items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
  }));
  const codeKey = (voucherCode || "").trim().toUpperCase();

  return useQuery({
    queryKey: ["promotion-quote", normalizedItems, codeKey],
    queryFn: () => promotionsService.quote({ items: normalizedItems, voucherCode }),
    enabled: !!token && normalizedItems.length > 0,
    staleTime: 0,
  });
};

export const useCheckPromotion = () => {
  return useMutation({
    mutationFn: promotionsService.checkCode,
  });
};

export const useGetPromotions = (query?: PromotionQuery) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-promotions", query],
    queryFn: () => promotionsService.getAll(query),
    enabled: !!token,
  });
};

export const useGetPromotion = (id: string) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-promotion", id],
    queryFn: () => promotionsService.getOne(id),
    enabled: !!token && !!id && id !== "create",
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromotionDto) => promotionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromotionDto }) =>
      promotionsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-promotion", String(data.id)] });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promotionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
  });
};
