import { IsOptional, IsString, IsNumber } from "class-validator";

export class CreateAuditLogDto {
  @IsOptional()
  @IsNumber()
  userId?: number | null;

  @IsOptional()
  @IsString()
  userEmail?: string | null;

  @IsOptional()
  @IsString()
  userRole?: string | null;

  @IsString()
  action!: string;

  @IsString()
  entityType!: string;

  @IsOptional()
  @IsString()
  entityId?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  oldValue?: any;

  @IsOptional()
  newValue?: any;

  @IsOptional()
  @IsString()
  ipAddress?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsString()
  status?: string | null;

  @IsOptional()
  @IsString()
  errorMessage?: string | null;
}
