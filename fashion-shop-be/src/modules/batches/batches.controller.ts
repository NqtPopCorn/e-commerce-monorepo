import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { BatchesService } from "./batches.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("batches")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class BatchesController {
  constructor(private readonly service: BatchesService) {}

  @Post()
  create(@Body() data: { code: string; variantId: number; quantity: number }) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
