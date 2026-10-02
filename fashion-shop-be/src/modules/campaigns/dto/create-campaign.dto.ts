import { Type } from "class-transformer";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty({ message: "Tên chiến dịch không được để trống" })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString({}, { message: "Ngày bắt đầu không đúng định dạng ngày" })
  @IsNotEmpty({ message: "Ngày bắt đầu không được để trống" })
  startsAt!: string;

  @IsOptional()
  @IsDateString({}, { message: "Ngày kết thúc không đúng định dạng ngày" })
  endsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Ngân sách tối đa phải là số" })
  @Min(0, { message: "Ngân sách tối đa không được âm" })
  budgetLimit?: number;
}
