import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, MinLength } from "class-validator";

export class ResetPasswordOtpDto {
  @ApiProperty({
    description: "Email hoặc số điện thoại đã nhận mã",
    example: "customer@example.com hoặc 0901234567",
  })
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập email hoặc số điện thoại" })
  target!: string;

  @ApiProperty({
    description: "Mã OTP 6 chữ số đã được gửi",
    example: "123456",
  })
  @IsString()
  @Length(6, 6, { message: "Mã OTP phải gồm chính xác 6 chữ số" })
  code!: string;

  @ApiProperty({
    description: "Mật khẩu mới",
    example: "NewPassword@123",
  })
  @IsString()
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  newPassword!: string;
}
