import { IsIn } from "class-validator";
export class UpdateOrderStatusDto {
  @IsIn(["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"])
  status!: string;
}
