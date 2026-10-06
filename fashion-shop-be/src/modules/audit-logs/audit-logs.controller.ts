import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AuditLogsService } from "./audit-logs.service";
import { QueryAuditLogsDto } from "./dto/query-audit-logs.dto";

@ApiTags("admin-audit-logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get("summary")
  getSummary() {
    return this.auditLogsService.getSummary();
  }

  @Get()
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(":id")
  getDetail(@Param("id", ParseIntPipe) id: number) {
    return this.auditLogsService.getDetail(id);
  }
}
