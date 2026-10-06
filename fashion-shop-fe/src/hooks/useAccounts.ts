import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { accountsService } from "@/services/accounts.service";
import {
  ChangePasswordDto,
  CreateAccountDto,
  CreateAddressDto,
  GetAccountsParams,
  UpdateAddressDto,
  UpdateAdminAccountDto,
  UpdateProfileDto,
} from "@/types/account";

// Admin / Staff hooks
export const useGetAccounts = (params?: GetAccountsParams) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-accounts", params],
    queryFn: () => accountsService.getAll(params),
    enabled: !!token,
  });
};

export const useGetAccountSummary = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-accounts-summary"],
    queryFn: accountsService.getSummary,
    enabled: !!token,
  });
};

export const useGetAccountDetail = (id?: number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-account-detail", id],
    queryFn: () => accountsService.getById(id!),
    enabled: !!token && !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountDto) => accountsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-summary"] });
    },
  });
};

export const useUpdateAdminAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAdminAccountDto }) =>
      accountsService.updateAdmin(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-summary"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-account-detail", variables.id],
      });
    },
  });
};

export const useUpdateAccountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      accountsService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-accounts-summary"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-account-detail", variables.id],
      });
    },
  });
};

// Customer Personal Profile & Address hooks
export const useGetMe = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["user-me"],
    queryFn: accountsService.getMe,
    enabled: !!token,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => accountsService.updateMe(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      if (token && updatedUser) {
        setAuth(token, {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: updatedUser.firstName || undefined,
          lastName: updatedUser.lastName || undefined,
        });
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) =>
      accountsService.changePassword(data),
  });
};

export const useGetMyAddresses = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["user-addresses"],
    queryFn: accountsService.getMyAddresses,
    enabled: !!token,
  });
};

export const useCreateMyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressDto) =>
      accountsService.createMyAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

export const useUpdateMyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressDto }) =>
      accountsService.updateMyAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

export const useDeleteMyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsService.deleteMyAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};

export const useSetDefaultMyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsService.setDefaultMyAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
};
