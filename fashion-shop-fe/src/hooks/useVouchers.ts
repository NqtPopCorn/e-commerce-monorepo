import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vouchersService } from "@/services/vouchers.service";
import { useAuthStore } from "@/stores/auth.store";
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  VoucherQuery,
} from "@/types/voucher";

export const useGetVouchers = (query?: VoucherQuery) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-vouchers", query],
    queryFn: () => vouchersService.getAll(query),
    enabled: !!token,
  });
};

export const useGetVoucher = (id: string | number) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-voucher", String(id)],
    queryFn: () => vouchersService.getOne(id),
    enabled: !!token && !!id && id !== "create",
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoucherDto) => vouchersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateVoucherDto;
    }) => vouchersService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-voucher", String(data.id)],
      });
    },
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => vouchersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });
};

export const useCheckVoucherCode = () => {
  return useMutation({
    mutationFn: (code: string) => vouchersService.checkCode(code),
  });
};
