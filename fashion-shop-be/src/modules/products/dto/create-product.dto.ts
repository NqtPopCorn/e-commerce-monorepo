import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateProductVariantDto {
  @IsString() sku!: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() colorHex?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() @Min(0) listPrice!: number;
  @IsNumber() @Min(0) sellingPrice!: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() weight?: number;
}

export class CreateProductImageDto {
  @IsString() url!: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateProductDto {
  @IsString() name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() brandId?: number;
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() careInstructions?: string;
  @IsOptional() @IsString() season?: string;
  @IsOptional() @IsString() provider?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}
