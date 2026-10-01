import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OtpType } from "@prisma/client";

export class SendOtpDto {
  @ApiProperty({
    description: "Email hoặc số điện thoại nhận mã OTP",
    example: "customer@example.com hoặc 0901234567",
  })
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập email hoặc số điện thoại" })
  target!: string;

  @ApiPropertyOptional({
    enum: OtpType,
    default: OtpType.FORGOT_PASSWORD,
    description: "Loại nghiệp vụ OTP",
  })
  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;

  @ApiPropertyOptional({
    enum: ["EMAIL", "SMS"],
    description: "Kênh gửi (nếu không cung cấp, hệ thống tự nhận diện)",
  })
  @IsOptional()
  @IsString()
  channel?: "EMAIL" | "SMS";
}
