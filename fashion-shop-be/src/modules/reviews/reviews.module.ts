import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ReviewsService } from "./reviews.service";
import { ReviewsController } from "./reviews.controller";
import { AdminReviewsController } from "./admin-reviews.controller";

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
