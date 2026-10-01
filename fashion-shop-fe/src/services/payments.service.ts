import { api } from "@/lib/api";
import { Order } from "@/types/order";
import { VietQRInfo, PaymentStatusResponse } from "@/types/payment";

export const paymentsService = {
  getVietQRInfo: async (orderId: number): Promise<VietQRInfo> => {
    const res = await api.get(`/payments/vietqr/info/${orderId}`);
    return res.data;
  },

  getOrderPaymentStatus: async (
    orderId: number,
  ): Promise<PaymentStatusResponse> => {
    const res = await api.get(`/payments/orders/${orderId}/status`);
    return res.data;
  },

  confirmVietQRAdmin: async (orderId: number): Promise<Order> => {
    const res = await api.post(`/payments/orders/${orderId}/confirm-vietqr`);
    return res.data;
  },
};
