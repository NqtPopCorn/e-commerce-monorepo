import { api } from "@/lib/api";
import { CartInput } from "@/types/promotion";

export const ordersService = {
  create: async (data: { items: CartInput[]; voucherCode?: string }) => {
    const res = await api.post("/orders", data);
    return res.data;
  },
  getMyOrders: async () => {
    const res = await api.get("/orders/mine");
    return res.data;
  },
  getAdminOrders: async (status?: string) => {
    const res = await api.get("/admin/orders", { params: { status } });
    return res.data;
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.patch(`/admin/orders/${id}/status`, { status });
    return res.data;
  },
};
