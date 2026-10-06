import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@ApiTags("admin/analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Tổng quan hiệu suất kinh doanh (Overview Workspace)" })
  async getOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(query);
  }

  @Get("products")
  @ApiOperation({ summary: "Danh sách phân tích hiệu suất sản phẩm" })
  async getProducts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProducts(query);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Chi tiết hiệu suất biến thể của một sản phẩm" })
  async getProductDetail(
    @Param("id", ParseIntPipe) id: number,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getProductDetail(id, query);
  }

  @Get("promotions")
  @ApiOperation({ summary: "Báo cáo hiệu quả khuyến mãi & chiến dịch" })
  async getPromotions(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPromotions(query);
  }

  @Get("inventory")
  @ApiOperation({ summary: "Tín hiệu sức khỏe tồn kho & SKU cảnh báo" })
  async getInventory(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getInventory(query);
  }

  @Get("customers")
  @ApiOperation({ summary: "Phân tích khách hàng theo hạng thành viên (Tier)" })
  async getCustomers(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomers(query);
  }
}
