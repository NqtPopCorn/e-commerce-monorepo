import { DiscountType } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty({ message: "Mã voucher không được để trống" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9_-]+$/, {
    message: "Mã voucher chỉ được chứa chữ cái in hoa, số, dấu gạch dưới hoặc gạch ngang",
  })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: "Tên voucher không được để trống" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  campaignId?: number;

  @IsEnum(DiscountType, { message: "Loại giảm giá voucher phải là PERCENT hoặc FIXED" })
  discountType!: DiscountType;

  @IsNumber({}, { message: "Giá trị giảm giá phải là số" })
  @Min(1, { message: "Giá trị giảm giá phải lớn hơn 0" })
  discountValue!: number;

  @IsOptional()
  @IsNumber({}, { message: "Giá trị giảm tối đa phải là số" })
  @Min(0)
  maxDiscountValue?: number;

  @IsOptional()
  @IsNumber({}, { message: "Giá trị đơn hàng tối thiểu phải là số" })
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsesPerCustomer?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: "Ngân sách tối đa của voucher phải là số" })
  @Min(0)
  budgetLimit?: number;

  @IsDateString({}, { message: "Ngày bắt đầu không đúng định dạng ngày" })
  startsAt!: string;

  @IsOptional()
  @IsDateString({}, { message: "Ngày kết thúc không đúng định dạng ngày" })
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
