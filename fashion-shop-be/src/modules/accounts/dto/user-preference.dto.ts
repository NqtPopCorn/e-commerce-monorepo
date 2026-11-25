import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateUserPreferenceDto {
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(150)
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(160)
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(160)
  hipCm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSizes?: string[];

  @IsOptional()
  @IsString()
  fitPreference?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteColors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedColors?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePreferenceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePreferenceMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  frequentOccasions?: string[];
}
