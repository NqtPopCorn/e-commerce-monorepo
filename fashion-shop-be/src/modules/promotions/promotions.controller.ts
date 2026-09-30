import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { PromotionQueryDto } from "./dto/promotion-common.dto";
import { QuotePromotionDto } from "./dto/quote-promotion.dto";
import { PromotionPricingService } from "./promotion-pricing.service";
import { Role } from "@prisma/client";

@ApiTags("promotions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("promotions")
export class PromotionsController {
  constructor(
    private readonly service: PromotionsService,
    private readonly pricingService: PromotionPricingService,
  ) {}

  @Post("quote")
  quote(@Body() dto: QuotePromotionDto) {
    return this.pricingService.quote(dto.items, dto.voucherCode);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePromotionDto, @Req() req: any) {
    return this.service.create(dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: PromotionQueryDto) {
    return this.service.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(+id);
  }

  @Get("check/:code")
  checkCode(@Param("code") code: string) {
    return this.service.checkCode(code);
  }

  @Roles(Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePromotionDto,
    @Req() req: any,
  ) {
    return this.service.update(+id, dto, req?.user, req);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.service.remove(+id, req?.user, req);
  }
}
