import { api } from "@/lib/api";
import { Category } from "@/types/product";

export interface CreateCategoryDto {
  name: string;
  parentId?: number | null;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: number | null;
}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get("/categories");
    return res.data;
  },
  getTree: async (): Promise<Category[]> => {
    const res = await api.get("/categories/tree");
    return res.data;
  },
  getById: async (id: number | string): Promise<Category> => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
  create: async (data: CreateCategoryDto): Promise<Category> => {
    const res = await api.post("/categories", data);
    return res.data;
  },
  update: async (
    id: number | string,
    data: UpdateCategoryDto,
  ): Promise<Category> => {
    const res = await api.patch(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: number | string): Promise<Category> => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
