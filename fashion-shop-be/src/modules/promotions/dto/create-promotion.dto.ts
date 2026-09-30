import { PromotionApplicationType } from "@prisma/client";
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
import { CreateVoucherDto } from "./create-voucher.dto";
import { PromotionGroupDto } from "./promotion-group.dto";

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionApplicationType)
  applicationType!: PromotionApplicationType;

  @IsOptional()
  @IsInt()
  campaignId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetLimit?: number;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionGroupDto)
  @ArrayMinSize(1)
  groups!: PromotionGroupDto[];

  @ValidateIf((o) => o.applicationType === PromotionApplicationType.VOUCHER)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherDto)
  vouchers?: CreateVoucherDto[];

  // Tiện ích hỗ trợ tạo nhanh 1 voucher đơn lẻ qua form
  @ValidateIf((o) => o.applicationType === PromotionApplicationType.VOUCHER)
  @IsOptional()
  @IsString()
  code?: string;

  @ValidateIf((o) => o.applicationType === PromotionApplicationType.VOUCHER)
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsesPerCustomer?: number;
}
