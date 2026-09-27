import { api } from "@/lib/api";
import { Category } from "@/types/product";

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get("/categories");
    return res.data;
  },
  getTree: async (): Promise<Category[]> => {
    const res = await api.get("/categories/tree");
    return res.data;
  },
};
