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
  totalOrderAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  isPartial?: boolean;
  transferContent: string;
}

export interface PaymentTransactionItem {
  id: number;
  amount: number;
  providerTxnId?: string;
  paidAt?: string;
}

export interface PaymentStatusResponse {
  orderId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  isPartial?: boolean;
  transactions?: PaymentTransactionItem[];
  updatedAt: string;
}

export interface SimulatePaymentParams {
  orderId: number;
  scenario?: "SUCCESS" | "UNDERPAID" | "WRONG_MEMO" | "DUPLICATE";
  amount?: number;
  customContent?: string;
}

export interface SimulatePaymentResponse {
  simulation: {
    scenario: string;
    payload: any;
  };
  result: {
    success: boolean;
    message: string;
    orderId?: number;
  };
}
