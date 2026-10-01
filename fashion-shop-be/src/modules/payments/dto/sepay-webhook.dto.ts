import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";

export class SePayWebhookDto {
  @IsNotEmpty()
  id!: number | string;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  transferType?: string; // 'in' or 'out'

  @IsOptional()
  @IsNumber()
  transferAmount?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
