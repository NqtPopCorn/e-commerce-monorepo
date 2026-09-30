import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateAddressDto {
  @IsNotEmpty({ message: "Vui lòng nhập tên người nhận" })
  @IsString()
  @MaxLength(100)
  recipientName!: string;

  @IsNotEmpty({ message: "Vui lòng nhập số điện thoại" })
  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsNotEmpty({ message: "Vui lòng nhập địa chỉ chi tiết" })
  @IsString()
  street!: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsNotEmpty({ message: "Vui lòng nhập tỉnh/thành phố" })
  @IsString()
  city!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
