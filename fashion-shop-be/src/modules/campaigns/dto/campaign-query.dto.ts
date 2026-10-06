import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CampaignQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["SCHEDULED", "ACTIVE", "ENDED"], {
    message: "Trạng thái phải là SCHEDULED, ACTIVE, hoặc ENDED",
  })
  status?: "SCHEDULED" | "ACTIVE" | "ENDED";

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsIn(["createdAt", "startsAt", "endsAt", "name", "spentAmount"])
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
