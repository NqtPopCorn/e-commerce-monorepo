import { DiscountType } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class PromotionGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(1)
  discountValue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountValue?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  variantIds?: number[];
}
