import { OrderStatus, PaymentMethod, PaymentStatus } from "./order";

export interface VietQRInfo {
  orderId: number;
  qrUrl: string;
  emvPayload?: string;
  bankBin: string;
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  transferContent: string;
}

export interface PaymentStatusResponse {
  orderId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  updatedAt: string;
}
