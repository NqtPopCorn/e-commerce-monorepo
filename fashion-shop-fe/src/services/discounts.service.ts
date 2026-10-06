import { api } from "@/lib/api";
import {
  CreateDiscountDto,
  Discount,
  DiscountQuery,
  PaginatedDiscountsResponse,
  UpdateDiscountDto,
} from "@/types/discount";

export const discountsService = {
  getAll: async (
    params?: DiscountQuery,
  ): Promise<PaginatedDiscountsResponse> => {
    const res = await api.get("/discounts", { params });
    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        total: res.data.length,
        page: 1,
        limit: res.data.length || 10,
        totalPages: 1,
      };
    }
    return res.data;
  },

  getOne: async (id: string | number): Promise<Discount> => {
    const res = await api.get(`/discounts/${id}`);
    return res.data;
  },

  create: async (data: CreateDiscountDto): Promise<Discount> => {
    const res = await api.post("/discounts", data);
    return res.data;
  },

  update: async (
    id: number | string,
    data: UpdateDiscountDto,
  ): Promise<Discount> => {
    const res = await api.patch(`/discounts/${id}`, data);
    return res.data;
  },

  remove: async (id: number | string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/discounts/${id}`);
    return res.data;
  },
};
