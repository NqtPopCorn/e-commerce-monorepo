import { api } from "@/lib/api";
import {
  CreatePurchaseDto,
  PaginatedPurchases,
  PurchaseReceipt,
  PurchasesQuery,
  PurchaseStats,
} from "@/types/purchase";

export const purchasesService = {
  getAll: async (query?: PurchasesQuery): Promise<PaginatedPurchases> => {
    const params: any = {};
    if (query?.page !== undefined) params.page = query.page;
    if (query?.limit !== undefined) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.supplier) params.supplier = query.supplier;

    const res = await api.get("/purchases", { params });
    // Nếu backend trả về array (unpaginated) fallback về format { data, meta }
    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        meta: {
          total: res.data.length,
          page: 1,
          limit: res.data.length,
          totalPages: 1,
        },
      };
    }
    return res.data;
  },

  getStats: async (): Promise<PurchaseStats> => {
    const res = await api.get("/purchases/stats");
    return res.data;
  },

  getById: async (id: number): Promise<PurchaseReceipt> => {
    const res = await api.get(`/purchases/${id}`);
    return res.data;
  },

  create: async (data: CreatePurchaseDto): Promise<PurchaseReceipt> => {
    const res = await api.post("/purchases", data);
    return res.data;
  },
};
