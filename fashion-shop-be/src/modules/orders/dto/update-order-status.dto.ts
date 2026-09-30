import { IsIn, IsOptional } from "class-validator";

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsIn(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"])
  status?: string;

  @IsOptional()
  @IsIn(["UNPAID", "PAID", "REFUNDED"])
  paymentStatus?: string;
}
