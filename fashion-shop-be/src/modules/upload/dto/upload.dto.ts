import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UploadQueryDto {
  @ApiPropertyOptional({
    description:
      "Thư mục phân loại file (vd: products, avatars, brands, promotions)",
    default: "general",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Tên thư mục chỉ được chứa chữ cái, số, dấu gạch ngang (-) hoặc gạch dưới (_)",
  })
  folder?: string;
}

export class DeleteFileDto {
  @ApiProperty({
    description: "Storage key hoặc public_id cần xóa",
    example: "products/1727715000000-abc-shirt.jpg",
  })
  @IsNotEmpty({ message: "Key không được để trống" })
  @IsString()
  key!: string;
}
