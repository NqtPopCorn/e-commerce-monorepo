import { api } from "@/lib/api";
import {
  Campaign,
  CampaignQuery,
  CampaignStatsResponse,
  CreateCampaignDto,
  PaginatedCampaignsResponse,
  UpdateCampaignDto,
} from "@/types/campaign";

export const campaignsService = {
  getAll: async (
    params?: CampaignQuery,
  ): Promise<PaginatedCampaignsResponse> => {
    const res = await api.get("/campaigns", { params });
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

  getOne: async (id: string | number): Promise<Campaign> => {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  },

  getStats: async (id: string | number): Promise<CampaignStatsResponse> => {
    const res = await api.get(`/campaigns/${id}/stats`);
    return res.data;
  },

  create: async (data: CreateCampaignDto): Promise<Campaign> => {
    const res = await api.post("/campaigns", data);
    return res.data;
  },

  update: async (
    id: number | string,
    data: UpdateCampaignDto,
  ): Promise<Campaign> => {
    const res = await api.patch(`/campaigns/${id}`, data);
    return res.data;
  },

  remove: async (
    id: number | string,
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  },
};
