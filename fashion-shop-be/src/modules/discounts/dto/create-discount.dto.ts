import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { DiscountGroupDto } from "./discount-group.dto";

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty({ message: "Tên chương trình giảm giá không được để trống" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  campaignId?: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsNumber({}, { message: "Ngân sách tối đa phải là số" })
  @Min(0)
  budgetLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsDateString({}, { message: "Ngày bắt đầu không đúng định dạng ngày" })
  startsAt!: string;

  @IsOptional()
  @IsDateString({}, { message: "Ngày kết thúc không đúng định dạng ngày" })
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray({ message: "Danh sách nhóm giảm giá phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => DiscountGroupDto)
  @ArrayMinSize(1, { message: "Chương trình giảm giá phải có ít nhất 1 nhóm giảm giá" })
  groups!: DiscountGroupDto[];
}
