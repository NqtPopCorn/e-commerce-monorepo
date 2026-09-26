import { DiscountType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from "class-validator";

export class PromotionGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(1)
  discountValue!: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  variantIds!: number[];
}
