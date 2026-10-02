import { IsOptional, IsDateString, IsBoolean, IsInt } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: "Thời gian bắt đầu (ISO String, vd: 2026-09-01T00:00:00.000Z)",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Thời gian kết thúc (ISO String, vd: 2026-09-30T23:59:59.999Z)",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: "Có so sánh với chu kỳ trước có cùng độ dài hay không",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true" || value === true || value === 1 || value === "1") return true;
    if (value === "false" || value === false || value === 0 || value === "0") return false;
    return true;
  })
  compare?: boolean = true;

  @ApiPropertyOptional({ description: "Lọc theo ID danh mục sản phẩm" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: "Lọc theo ID thương hiệu" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({ description: "Lọc theo ID sản phẩm cụ thể" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({ description: "Lọc theo ID chiến dịch khuyến mãi" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  campaignId?: number;
}
