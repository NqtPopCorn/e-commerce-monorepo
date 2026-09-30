import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import {
  CreateProductDto,
  UpdateProductDto,
  GetProductsParams,
} from "@/types/product";

export const useGetProducts = (params?: GetProductsParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.getAll(params),
  });
};

export const useGetPaginatedProducts = (params?: GetProductsParams) => {
  return useQuery({
    queryKey: ["products-paginated", params],
    queryFn: () => productsService.getPaginated(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useGetProductStats = () => {
  return useQuery({
    queryKey: ["products-stats"],
    queryFn: () => productsService.getStats(),
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
      queryClient.invalidateQueries({ queryKey: ["products-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateProductDto;
    }) => productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["products-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["products-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};
