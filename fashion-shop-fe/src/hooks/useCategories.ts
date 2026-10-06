import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  categoriesService,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/services/categories.service";

export const useGetCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
  });
};

export const useGetCategoryTree = () => {
  return useQuery({
    queryKey: ["category-tree"],
    queryFn: categoriesService.getTree,
  });
};

export const useGetCategory = (id: string | number) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateCategoryDto;
    }) => categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-tree"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
