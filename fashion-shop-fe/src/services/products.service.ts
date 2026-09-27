import { api } from "@/lib/api";
import { Product, CreateProductDto, UpdateProductDto } from "@/types/product";

export const productsService = {
  getAll: async (params?: { search?: string; categoryId?: number; brandId?: number }): Promise<Product[]> => {
    const res = await api.get("/products", { params });
    return res.data;
  },
  getById: async (id: string | number): Promise<Product> => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  getBySlug: async (slug: string): Promise<Product> => {
    const res = await api.get(`/products/slug/${slug}`);
    return res.data;
  },
  create: async (data: CreateProductDto): Promise<Product> => {
    const res = await api.post("/products", data);
    return res.data;
  },
  update: async (id: number | string, data: UpdateProductDto): Promise<Product> => {
    const res = await api.patch(`/products/${id}`, data);
    return res.data;
  },
  delete: async (id: number | string): Promise<Product> => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};
