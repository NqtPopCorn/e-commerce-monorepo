import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { CampaignQueryDto } from "./dto/campaign-query.dto";

@ApiTags("campaigns")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("campaigns")
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignsService.create(dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: CampaignQueryDto) {
    return this.campaignsService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.campaignsService.findOne(+id);
  }

  @Roles(Role.ADMIN)
  @Get(":id/stats")
  getStats(@Param("id") id: string) {
    return this.campaignsService.getStats(+id);
  }

  @Roles(Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCampaignDto,
    @Req() req: any,
  ) {
    return this.campaignsService.update(+id, dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.campaignsService.remove(+id, req?.user, req);
  }
}
