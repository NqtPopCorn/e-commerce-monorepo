import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PaymentProvider } from '../payment.constants';

/**
 * Deliberately has NO amount/currency: the server derives them from the order,
 * otherwise a client could pay 1 VND for a 1,000,000 VND order.
 */
export class CreatePaymentDto {
  @IsString()
  @MaxLength(64)
  orderId!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}
