import { api } from "@/lib/api";
import { Account, GetAccountsParams, PaginatedAccountsResponse } from "@/types/account";

export const accountsService = {
  getAll: async (params?: GetAccountsParams): Promise<PaginatedAccountsResponse> => {
    const res = await api.get("/account", { params });
    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        meta: {
          total: res.data.length,
          page: 1,
          limit: res.data.length || 10,
          totalPages: 1,
        },
      };
    }
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<Account> => {
    const res = await api.patch(`/account/${id}/status`, { status });
    return res.data;
  },
};
