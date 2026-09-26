import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "@/services/orders.service";
import { useAuthStore } from "@/stores/auth.store";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};

export const useGetMyOrders = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["orders"],
    queryFn: ordersService.getMyOrders,
    enabled: !!token,
  });
};

export const useGetAdminOrders = (status?: string) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => ordersService.getAdminOrders(status),
    enabled: !!token && user?.role === "ADMIN",
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      ordersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};
