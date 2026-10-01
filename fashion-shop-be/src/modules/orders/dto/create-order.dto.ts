import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class OrderItemDto {
  @IsInt()
  @Min(1)
  variantId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingNote?: string;

  @IsOptional()
  @IsIn(["COD", "VIETQR", "BANK_TRANSFER"])
  paymentMethod?: "COD" | "VIETQR" | "BANK_TRANSFER";
}
