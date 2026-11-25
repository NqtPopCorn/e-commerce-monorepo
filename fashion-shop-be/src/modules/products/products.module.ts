import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PricingModule } from "../pricing/pricing.module";
import { EmbeddingService } from "./embedding.service";
import { ProductSearchService } from "./product-search.service";
import { ProductSearchRepository } from "./product-search.repository";

@Module({
  imports: [PricingModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    EmbeddingService,
    ProductSearchRepository,
    ProductSearchService,
  ],
  exports: [
    ProductsService,
    EmbeddingService,
    ProductSearchRepository,
    ProductSearchService,
  ],
})
export class ProductsModule {}
