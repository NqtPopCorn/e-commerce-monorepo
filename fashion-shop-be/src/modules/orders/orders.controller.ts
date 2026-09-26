import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get("mine")
  mine(@Req() req: any) {
    return this.service.findMine(req.user.id);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(req.user.id, id);
  }

  @Delete(":id")
  cancel(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.service.cancel(req.user.id, id);
  }
}
