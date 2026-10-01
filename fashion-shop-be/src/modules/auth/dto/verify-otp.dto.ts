import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { OtpType } from "@prisma/client";

export class VerifyOtpDto {
  @ApiProperty({
    description: "Email hoặc số điện thoại đã nhận mã",
    example: "customer@example.com hoặc 0901234567",
  })
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập email hoặc số điện thoại" })
  target!: string;

  @ApiProperty({
    description: "Mã OTP 6 chữ số",
    example: "123456",
  })
  @IsString()
  @Length(6, 6, { message: "Mã OTP phải gồm chính xác 6 chữ số" })
  code!: string;

  @ApiPropertyOptional({
    enum: OtpType,
    default: OtpType.FORGOT_PASSWORD,
    description: "Loại nghiệp vụ OTP",
  })
  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}
