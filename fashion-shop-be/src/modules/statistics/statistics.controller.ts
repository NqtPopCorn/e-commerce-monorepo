import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { StatisticsService } from "./statistics.service";
@ApiTags("statistics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("statistics")
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}
  @Get("overview") overview() {
    return this.service.overview();
  }

  @Get("revenue") getRevenue() {
    return this.service.getRevenue();
  }

  @Get("stock") getStock() {
    return this.service.getStock();
  }
}
