import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SimulatePaymentDto {
  @ApiProperty({ example: 1, description: "ID đơn hàng cần giả lập thanh toán" })
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiPropertyOptional({
    enum: ["SUCCESS", "UNDERPAID", "WRONG_MEMO", "DUPLICATE"],
    default: "SUCCESS",
    description: "Kịch bản thanh toán giả lập",
  })
  @IsOptional()
  @IsIn(["SUCCESS", "UNDERPAID", "WRONG_MEMO", "DUPLICATE"])
  scenario?: "SUCCESS" | "UNDERPAID" | "WRONG_MEMO" | "DUPLICATE";

  @ApiPropertyOptional({
    example: 250000,
    description: "Số tiền chuyển khoản tuỳ chọn",
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    example: "DH1 chuyen khoan",
    description: "Nội dung chuyển khoản tuỳ chọn",
  })
  @IsOptional()
  @IsString()
  customContent?: string;
}
