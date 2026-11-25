import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PricingModule } from "../pricing/pricing.module";
import { EmbeddingService } from "./embedding.service";

@Module({
  imports: [PricingModule],
  controllers: [ProductsController],
  providers: [ProductsService, EmbeddingService],
  exports: [ProductsService, EmbeddingService],
})
export class ProductsModule {}
