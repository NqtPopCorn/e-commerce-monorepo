import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "@/services/payments.service";
import { SimulatePaymentParams } from "@/types/payment";

export const useGetVietQRInfo = (orderId?: number | null, enabled = true) => {
  return useQuery({
    queryKey: ["vietqr-info", orderId],
    queryFn: () => paymentsService.getVietQRInfo(orderId!),
    enabled: !!orderId && enabled,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useGetOrderPaymentStatus = (
  orderId?: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: any) => number | false);
  },
) => {
  return useQuery({
    queryKey: ["order-payment-status", orderId],
    queryFn: () => paymentsService.getOrderPaymentStatus(orderId!),
    enabled: !!orderId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 4000,
  });
};

export const useConfirmVietQRAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      paymentsService.confirmVietQRAdmin(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({
        queryKey: ["order-payment-status", orderId],
      });
    },
  });
};

export const useSimulatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SimulatePaymentParams) =>
      paymentsService.simulatePayment(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["order-payment-status", vars.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vietqr-info", vars.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["order", vars.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};
