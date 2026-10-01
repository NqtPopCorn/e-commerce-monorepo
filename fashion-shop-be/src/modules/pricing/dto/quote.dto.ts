import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CartItemDto {
  @IsInt({ message: "Mã biến thể sản phẩm phải là số nguyên" })
  @Min(1, { message: "Mã biến thể sản phẩm không hợp lệ" })
  variantId!: number;

  @IsInt({ message: "Số lượng sản phẩm phải là số nguyên" })
  @Min(1, { message: "Số lượng sản phẩm phải lớn hơn 0" })
  quantity!: number;
}

export class QuoteDto {
  @IsArray({ message: "Danh sách sản phẩm tính giá phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  @ArrayMinSize(1, { message: "Danh sách sản phẩm không được rỗng" })
  items!: CartItemDto[];

  @IsOptional()
  @IsString({ message: "Mã voucher phải là chuỗi ký tự" })
  voucherCode?: string;
}
