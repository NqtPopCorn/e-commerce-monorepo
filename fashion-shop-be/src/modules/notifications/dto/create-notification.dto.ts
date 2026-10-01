import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NotificationLevel, NotificationType } from "@prisma/client";

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationLevel)
  level?: NotificationLevel;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  data?: Record<string, any>;
}
