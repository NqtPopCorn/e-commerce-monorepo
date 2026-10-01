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
import { DiscountsService } from "./discounts.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { DiscountQueryDto } from "./dto/discount-query.dto";

@ApiTags("discounts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("discounts")
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateDiscountDto, @Req() req: any) {
    return this.discountsService.create(dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: DiscountQueryDto) {
    return this.discountsService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.discountsService.findOne(+id);
  }

  @Roles(Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDiscountDto,
    @Req() req: any,
  ) {
    return this.discountsService.update(+id, dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.discountsService.remove(+id, req?.user, req);
  }
}
