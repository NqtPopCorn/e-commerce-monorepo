import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { QueryReviewsDto } from "./dto/query-reviews.dto";

@ApiTags("reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get("products/:productId/reviews")
  getProductReviews(
    @Param("productId", ParseIntPipe) productId: number,
    @Query() query: QueryReviewsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.service.getProductReviews(productId, query, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("products/:productId/review-eligibility")
  checkEligibility(
    @Req() req: any,
    @Param("productId", ParseIntPipe) productId: number,
  ) {
    return this.service.checkEligibility(req.user.id, productId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("reviews")
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.service.create(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put("reviews/:id")
  update(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("reviews/:id/like")
  toggleLike(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.service.toggleLike(req.user.id, id);
  }
}
