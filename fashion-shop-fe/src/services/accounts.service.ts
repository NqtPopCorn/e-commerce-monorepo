import { api } from "@/lib/api";
import { Account } from "@/types/account";

export const accountsService = {
  getAll: async (): Promise<Account[]> => {
    const res = await api.get("/account");
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<Account> => {
    const res = await api.patch(`/account/${id}/status`, { status });
    return res.data;
  },
};
