import { api } from "@/lib/api";
import {
  CreatePromotionDto,
  Promotion,
  PromotionQuery,
  PromotionQuote,
  QuoteRequest,
  UpdatePromotionDto,
} from "@/types/promotion";

export const promotionsService = {
  quote: async (payload: QuoteRequest): Promise<PromotionQuote> => {
    const res = await api.post("/promotions/quote", payload);
    return res.data;
  },

  checkCode: async (code: string): Promise<Promotion> => {
    const res = await api.get(`/promotions/check/${code}`);
    return res.data;
  },

  getAll: async (params?: PromotionQuery): Promise<Promotion[]> => {
    const res = await api.get("/promotions", { params });
    return res.data;
  },

  getOne: async (id: string | number): Promise<Promotion> => {
    const res = await api.get(`/promotions/${id}`);
    return res.data;
  },

  create: async (data: CreatePromotionDto): Promise<Promotion> => {
    const res = await api.post("/promotions", data);
    return res.data;
  },

  update: async (id: number, data: UpdatePromotionDto): Promise<Promotion> => {
    const res = await api.patch(`/promotions/${id}`, data);
    return res.data;
  },

  remove: async (id: number): Promise<Promotion> => {
    const res = await api.delete(`/promotions/${id}`);
    return res.data;
  },
};
