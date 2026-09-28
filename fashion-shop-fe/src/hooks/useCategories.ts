import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categories.service";

export const useGetCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
  });
};
