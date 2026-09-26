import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CartItemDto {
  @IsInt()
  @Min(1)
  variantId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class QuotePromotionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  @ArrayMinSize(1)
  items!: CartItemDto[];

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
