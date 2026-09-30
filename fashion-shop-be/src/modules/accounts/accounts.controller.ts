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
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AccountsService } from "./accounts.service";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAdminAccountDto } from "./dto/update-admin-account.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";

@ApiTags("account")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("account")
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  // Current user personal profile
  @Get("me")
  me(@Req() req: any) {
    return this.service.me(req.user.id);
  }

  @Patch("me")
  update(@Req() req: any, @Body() dto: UpdateAccountDto) {
    return this.service.update(req.user.id, dto);
  }

  @Patch("change-password")
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(req.user.id, dto);
  }

  // Current user Address Book
  @Get("me/addresses")
  getAddresses(@Req() req: any) {
    return this.service.getAddresses(req.user.id);
  }

  @Post("me/addresses")
  createAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.service.createAddress(req.user.id, dto);
  }

  @Patch("me/addresses/:id")
  updateAddress(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.service.updateAddress(req.user.id, +id, dto);
  }

  @Delete("me/addresses/:id")
  deleteAddress(@Req() req: any, @Param("id") id: string) {
    return this.service.deleteAddress(req.user.id, +id);
  }

  @Patch("me/addresses/:id/default")
  setDefaultAddress(@Req() req: any, @Param("id") id: string) {
    return this.service.setDefaultAddress(req.user.id, +id);
  }

  // Admin / Staff Management
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "STAFF")
  @Get("summary")
  getSummary() {
    return this.service.getSummary();
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "STAFF")
  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      role,
      status,
    });
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "STAFF")
  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.service.getDetail(+id);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.service.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  updateAdmin(@Param("id") id: string, @Body() dto: UpdateAdminAccountDto) {
    return this.service.updateAdmin(+id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(+id, status);
  }
}
