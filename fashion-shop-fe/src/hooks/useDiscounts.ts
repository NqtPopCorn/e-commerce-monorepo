import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { discountsService } from "@/services/discounts.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  CreateDiscountDto,
  DiscountQuery,
  UpdateDiscountDto,
} from "@/types/discount";

export const useGetDiscounts = (query?: DiscountQuery) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-discounts", query],
    queryFn: () => discountsService.getAll(query),
    enabled: !!token,
  });
};

export const useGetDiscount = (id: string | number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-discount", String(id)],
    queryFn: () => discountsService.getOne(id),
    enabled: !!token && !!id && id !== "create",
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiscountDto) => discountsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discounts"] });
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateDiscountDto;
    }) => discountsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-discounts"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-discount", String(data.id)],
      });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => discountsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discounts"] });
    },
  });
};
