import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { PromotionPricingService } from "./promotion-pricing.service";

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionPricingService],
  exports: [PromotionsService, PromotionPricingService],
})
export class PromotionsModule {}
