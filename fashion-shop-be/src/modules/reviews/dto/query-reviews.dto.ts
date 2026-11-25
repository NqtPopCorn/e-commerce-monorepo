import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { ProductFit } from "@prisma/client";

export enum ReviewSortOption {
  NEWEST = "newest",
  HIGHEST = "highest",
  LOWEST = "lowest",
  MOST_HELPFUL = "most_helpful",
}

export class QueryReviewsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  hasImages?: boolean;

  @IsOptional()
  @IsEnum(ProductFit)
  fit?: ProductFit;

  @IsOptional()
  @IsEnum(ReviewSortOption)
  sort?: ReviewSortOption = ReviewSortOption.NEWEST;
}
