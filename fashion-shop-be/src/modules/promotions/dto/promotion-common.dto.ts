import { PromotionKind } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsOptional } from "class-validator";

export class PromotionQueryDto {
  @IsOptional()
  @IsEnum(PromotionKind)
  kind?: PromotionKind;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
