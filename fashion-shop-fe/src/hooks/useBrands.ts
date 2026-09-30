import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  brandsService,
  CreateBrandDto,
  UpdateBrandDto,
} from "@/services/brands.service";

export const useGetBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: brandsService.getAll,
  });
};

export const useGetBrand = (id: string | number) => {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandsService.getById(id),
    enabled: !!id,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandDto) => brandsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateBrandDto }) =>
      brandsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => brandsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};
