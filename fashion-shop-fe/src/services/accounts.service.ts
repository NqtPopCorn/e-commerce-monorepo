import { api } from "@/lib/api";
import {
  Account,
  AccountSummary,
  Address,
  ChangePasswordDto,
  CreateAccountDto,
  CreateAddressDto,
  GetAccountsParams,
  PaginatedAccountsResponse,
  UpdateAddressDto,
  UpdateAdminAccountDto,
  UpdateProfileDto,
} from "@/types/account";

export const accountsService = {
  // Current user personal profile
  getMe: async (): Promise<Account> => {
    const res = await api.get("/account/me");
    return res.data;
  },

  updateMe: async (data: UpdateProfileDto): Promise<Account> => {
    const res = await api.patch("/account/me", data);
    return res.data;
  },

  changePassword: async (
    data: ChangePasswordDto,
  ): Promise<{ message: string }> => {
    const res = await api.patch("/account/change-password", data);
    return res.data;
  },

  // Current user Address Book
  getMyAddresses: async (): Promise<Address[]> => {
    const res = await api.get("/account/me/addresses");
    return res.data;
  },

  createMyAddress: async (data: CreateAddressDto): Promise<Address> => {
    const res = await api.post("/account/me/addresses", data);
    return res.data;
  },

  updateMyAddress: async (
    id: number,
    data: UpdateAddressDto,
  ): Promise<Address> => {
    const res = await api.patch(`/account/me/addresses/${id}`, data);
    return res.data;
  },

  deleteMyAddress: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/account/me/addresses/${id}`);
    return res.data;
  },

  setDefaultMyAddress: async (id: number): Promise<Address> => {
    const res = await api.patch(`/account/me/addresses/${id}/default`);
    return res.data;
  },

  // Admin & Staff Management
  getAll: async (
    params?: GetAccountsParams,
  ): Promise<PaginatedAccountsResponse> => {
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

  getSummary: async (): Promise<AccountSummary> => {
    const res = await api.get("/account/summary");
    return res.data;
  },

  getById: async (id: number): Promise<Account> => {
    const res = await api.get(`/account/${id}`);
    return res.data;
  },

  create: async (data: CreateAccountDto): Promise<Account> => {
    const res = await api.post("/account", data);
    return res.data;
  },

  updateAdmin: async (
    id: number,
    data: UpdateAdminAccountDto,
  ): Promise<Account> => {
    const res = await api.patch(`/account/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<Account> => {
    const res = await api.patch(`/account/${id}/status`, { status });
    return res.data;
  },
};
