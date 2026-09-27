import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import { CreateProductDto, UpdateProductDto } from "@/types/product";

export const useGetProducts = (params?: { search?: string; categoryId?: number; brandId?: number }) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.getAll(params),
  });
};

export const useGetProduct = (id: string | number) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
};

export const useGetProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["product-slug", slug],
    queryFn: () => productsService.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateProductDto }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};
