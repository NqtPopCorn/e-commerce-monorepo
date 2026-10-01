export class PaymentStatusResponseDto {
  orderId!: number;
  status!: string;
  paymentStatus!: string;
  paymentMethod!: string;
  total!: number;
  paidAt?: Date | null;
}
