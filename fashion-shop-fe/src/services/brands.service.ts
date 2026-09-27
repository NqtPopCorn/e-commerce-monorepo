import { api } from "@/lib/api";
import { Brand } from "@/types/product";

export interface CreateBrandDto {
  name: string;
  slug?: string;
  logo?: string;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {}

export const brandsService = {
  getAll: async (): Promise<Brand[]> => {
    const res = await api.get("/brands");
    return res.data;
  },
  getById: async (id: string | number): Promise<Brand> => {
    const res = await api.get(`/brands/${id}`);
    return res.data;
  },
  create: async (data: CreateBrandDto): Promise<Brand> => {
    const res = await api.post("/brands", data);
    return res.data;
  },
  update: async (id: number | string, data: UpdateBrandDto): Promise<Brand> => {
    const res = await api.patch(`/brands/${id}`, data);
    return res.data;
  },
  delete: async (id: number | string): Promise<Brand> => {
    const res = await api.delete(`/brands/${id}`);
    return res.data;
  },
};
