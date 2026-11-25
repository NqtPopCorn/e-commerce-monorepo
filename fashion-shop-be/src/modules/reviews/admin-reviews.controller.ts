import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { ReviewsService } from "./reviews.service";
import {
  AdminQueryReviewsDto,
  AdminReplyDto,
  AdminUpdateStatusDto,
} from "./dto/admin-reviews.dto";

@ApiTags("admin-reviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/reviews")
export class AdminReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  findAll(@Query() query: AdminQueryReviewsDto) {
    return this.service.adminFindAll(query);
  }

  @Post(":id/reply")
  reply(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminReplyDto,
  ) {
    return this.service.adminReply(req.user.id, id, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdateStatusDto,
  ) {
    return this.service.adminUpdateStatus(id, dto.status);
  }
}
