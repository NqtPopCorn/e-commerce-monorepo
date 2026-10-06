import { DiscountType } from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class DiscountGroupDto {
  @IsString()
  @IsNotEmpty({ message: "Tên nhóm giảm giá không được để trống" })
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsEnum(DiscountType, { message: "Loại giảm giá phải là PERCENT hoặc FIXED" })
  discountType!: DiscountType;

  @IsNumber({}, { message: "Giá trị giảm giá phải là số" })
  @Min(1, { message: "Giá trị giảm giá phải lớn hơn 0" })
  discountValue!: number;

  @IsOptional()
  @IsNumber({}, { message: "Giá trị giảm tối đa phải là số" })
  @Min(0)
  maxDiscountValue?: number;

  @IsArray({ message: "Danh sách biến thể áp dụng phải là mảng" })
  @IsInt({ each: true, message: "Mã biến thể phải là số nguyên" })
  @ArrayMinSize(1, { message: "Nhóm giảm giá phải áp dụng cho ít nhất 1 sản phẩm/biến thể" })
  variantIds!: number[];
}
