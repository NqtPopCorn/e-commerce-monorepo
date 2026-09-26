import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BooksModule } from "./modules/books/books.module";

import { OrdersModule } from "./modules/orders/orders.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { HealthController } from "./health.controller";
import { CategoriesModule } from "./modules/categories/categories.module";
import { BatchesModule } from "./modules/batches/batches.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BooksModule,

    OrdersModule,
    StatisticsModule,
    PromotionsModule,
    AccountsModule,
    CategoriesModule,
    BatchesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
