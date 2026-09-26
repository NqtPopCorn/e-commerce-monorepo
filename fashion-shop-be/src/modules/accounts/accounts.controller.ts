import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AccountsService } from "./accounts.service";
import { UpdateAccountDto } from "./dto/update-account.dto";
@ApiTags("account")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("account")
export class AccountsController {
  constructor(private readonly service: AccountsService) {}
  @Get("me") me(@Req() req: any) {
    return this.service.me(req.user.id);
  }
  @Patch("me") update(@Req() req: any, @Body() dto: UpdateAccountDto) {
    return this.service.update(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.updateStatus(+id, status);
  }
}
