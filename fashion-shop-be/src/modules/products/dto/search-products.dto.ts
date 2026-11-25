import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { GenderTarget } from "@prisma/client";

export type ProductSearchSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating_desc";

export class ProductSearchFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsEnum(GenderTarget)
  targetGender?: GenderTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsString()
  fit?: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  inStockOnly?: boolean;
}

export class SearchProductsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSearchFiltersDto)
  filters?: ProductSearchFiltersDto;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  excludeProductIds?: number[];

  @IsOptional()
  @IsIn(["relevance", "price_asc", "price_desc", "rating_desc"])
  sort?: ProductSearchSort;

  @IsOptional()
  @IsBoolean()
  diversifyByGender?: boolean;

  @IsOptional()
  @IsObject()
  genderQueries?: Record<string, string>;

  @IsOptional()
  @IsObject()
  genderLimits?: Record<string, number>;

  @IsOptional()
  @IsBoolean()
  allowRelaxation?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

