import { api } from "@/lib/api";
import { Category } from "@/types/book";

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get("/categories");
    return res.data;
  },
};
