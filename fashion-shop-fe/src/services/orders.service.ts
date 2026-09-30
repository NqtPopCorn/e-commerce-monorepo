import { api } from "@/lib/api";
import {
  Order,
  CreateOrderParams,
  UpdateOrderStatusParams,
} from "@/types/order";

export type { CreateOrderParams };

export const ordersService = {
  create: async (data: CreateOrderParams): Promise<Order> => {
    const res = await api.post("/orders", data);
    return res.data;
  },
  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get("/orders/mine");
    return res.data;
  },
  getAdminOrders: async (status?: string): Promise<Order[]> => {
    const res = await api.get("/admin/orders", { params: { status } });
    return res.data;
  },
  updateStatus: async ({
    id,
    status,
    paymentStatus,
  }: UpdateOrderStatusParams): Promise<Order> => {
    const res = await api.patch(`/admin/orders/${id}/status`, {
      status,
      paymentStatus,
    });
    return res.data;
  },
};
