import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { PurchasesService } from "./purchases.service";

@ApiTags("purchases")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("purchases")
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Roles("ADMIN", "STAFF")
  @Post()
  create(@Body() dto: CreatePurchaseDto, @Req() req: any) {
    return this.service.create(dto, req?.user, req);
  }

  @Get()
  findAll(
    @Query("search") search?: string,
    @Query("supplier") supplier?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findAll({
      search,
      supplier,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("stats")
  getStats() {
    return this.service.getStats();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
