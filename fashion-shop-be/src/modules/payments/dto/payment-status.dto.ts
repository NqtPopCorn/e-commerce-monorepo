export class PaymentTransactionItemDto {
  id!: number;
  amount!: number;
  providerTxnId?: string | null;
  paidAt?: Date | string | null;
}

export class PaymentStatusResponseDto {
  orderId!: number;
  status!: string;
  paymentStatus!: string;
  paymentMethod!: string;
  total!: number;
  paidAmount?: number;
  remainingAmount?: number;
  isPartial?: boolean;
  transactions?: PaymentTransactionItemDto[];
  paidAt?: Date | null;
  updatedAt?: Date | string;
}
