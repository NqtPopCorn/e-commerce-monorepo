import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminOrdersService } from "./admin-orders.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
@ApiTags("admin-orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}
  @Get() findAll(@Query("status") status?: string) {
    return this.service.findAll(status);
  }
  @Patch(":id/status") updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
