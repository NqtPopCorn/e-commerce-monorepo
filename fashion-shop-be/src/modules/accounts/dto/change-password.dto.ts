import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu hiện tại" })
  @IsString()
  oldPassword!: string;

  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu mới" })
  @IsString()
  @MinLength(6, { message: "Mật khẩu mới tối thiểu 6 ký tự" })
  newPassword!: string;
}
