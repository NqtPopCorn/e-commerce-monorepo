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

export class CreateBookVariantDto {
  @IsString() sku!: string;
  @IsOptional() @IsString() isbn?: string;
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() @Min(0) listPrice!: number;
  @IsNumber() @Min(0) sellingPrice!: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() weight?: number;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsInt() pages?: number;
}

export class CreateBookDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() authors?: any;
  @IsOptional() translators?: any;
  @IsOptional() @IsString() publisher?: string;
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsInt() publishYear?: number;
  @IsOptional() @IsString() language?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookVariantDto)
  variants!: CreateBookVariantDto[];
}
