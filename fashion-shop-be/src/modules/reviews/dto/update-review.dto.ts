import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ArrayMaxSize,
} from "class-validator";
import { ProductFit } from "@prisma/client";

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  images?: string[];

  @IsOptional()
  @IsEnum(ProductFit)
  fit?: ProductFit;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  userHeight?: number;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(200)
  userWeight?: number;
}
