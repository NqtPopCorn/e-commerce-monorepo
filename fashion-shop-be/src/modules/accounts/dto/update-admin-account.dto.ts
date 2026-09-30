import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { AccountRoleDto } from "./create-account.dto";

export enum UserStatusDto {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}

export enum CustomerTierDto {
  STANDARD = "STANDARD",
  SILVER = "SILVER",
  GOLD = "GOLD",
  DIAMOND = "DIAMOND",
}

export class UpdateAdminAccountDto {
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
  @IsEnum(AccountRoleDto)
  role?: AccountRoleDto;

  @IsOptional()
  @IsEnum(UserStatusDto)
  status?: UserStatusDto;

  @IsOptional()
  @IsEnum(CustomerTierDto)
  tier?: CustomerTierDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
