import { api } from "@/lib/api";
import {
  CreateVoucherDto,
  PaginatedVouchersResponse,
  UpdateVoucherDto,
  Voucher,
  VoucherCheckResponse,
  VoucherQuery,
} from "@/types/voucher";

export const vouchersService = {
  getAll: async (params?: VoucherQuery): Promise<PaginatedVouchersResponse> => {
    const res = await api.get("/vouchers", { params });
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

  getOne: async (id: string | number): Promise<Voucher> => {
    const res = await api.get(`/vouchers/${id}`);
    return res.data;
  },

  create: async (data: CreateVoucherDto): Promise<Voucher> => {
    const res = await api.post("/vouchers", data);
    return res.data;
  },

  update: async (
    id: number | string,
    data: UpdateVoucherDto,
  ): Promise<Voucher> => {
    const res = await api.patch(`/vouchers/${id}`, data);
    return res.data;
  },

  remove: async (id: number | string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/vouchers/${id}`);
    return res.data;
  },

  checkCode: async (code: string): Promise<VoucherCheckResponse> => {
    const res = await api.get(`/vouchers/check/${encodeURIComponent(code)}`);
    return res.data;
  },
};
