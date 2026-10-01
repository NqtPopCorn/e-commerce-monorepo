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
import { VouchersService } from "./vouchers.service";
import { CreateVoucherDto } from "./dto/create-voucher.dto";
import { UpdateVoucherDto } from "./dto/update-voucher.dto";
import { VoucherQueryDto } from "./dto/voucher-query.dto";

@ApiTags("vouchers")
@Controller("vouchers")
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get("check/:code")
  checkCode(@Param("code") code: string) {
    return this.vouchersService.checkCode(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateVoucherDto, @Req() req: any) {
    return this.vouchersService.create(dto, req?.user, req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: VoucherQueryDto) {
    return this.vouchersService.findAll(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vouchersService.findOne(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateVoucherDto,
    @Req() req: any,
  ) {
    return this.vouchersService.update(+id, dto, req?.user, req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.vouchersService.remove(+id, req?.user, req);
  }
}
