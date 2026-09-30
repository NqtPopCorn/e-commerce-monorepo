import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export enum GenderRegisterDto {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export class RegisterDto {
  @IsEmail({}, { message: "Email không đúng định dạng" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Mật khẩu tối thiểu 6 ký tự" })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEnum(GenderRegisterDto)
  gender?: GenderRegisterDto;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
