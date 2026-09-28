import { DiscountType, PromotionKind } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { PromotionGroupDto } from "./promotion-group.dto";

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(PromotionKind)
  kind!: PromotionKind;

  @ValidateIf((o) => o.kind === PromotionKind.VOUCHER)
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ValidateIf(
    (o) =>
      o.kind === PromotionKind.VOUCHER || o.kind === PromotionKind.ORDER_AUTO,
  )
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ValidateIf(
    (o) =>
      o.kind === PromotionKind.VOUCHER || o.kind === PromotionKind.ORDER_AUTO,
  )
  @IsNumber()
  @Min(1)
  discountValue?: number;

  @ValidateIf(
    (o) =>
      o.kind === PromotionKind.VOUCHER || o.kind === PromotionKind.ORDER_AUTO,
  )
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @ValidateIf((o) => o.kind === PromotionKind.VOUCHER)
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ValidateIf((o) => o.kind === PromotionKind.CAMPAIGN)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionGroupDto)
  @ArrayMinSize(1)
  groups?: PromotionGroupDto[];
}
