import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProductsModule } from "./modules/products/products.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { VouchersModule } from "./modules/vouchers/vouchers.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { HealthController } from "./health.controller";
import { CategoriesModule } from "./modules/categories/categories.module";
import { PurchasesModule } from "./modules/purchases/purchases.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { UploadModule } from "./modules/upload/upload.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MailModule } from "./modules/mail/mail.module";
import { SmsModule } from "./modules/sms/sms.module";
import { PaymentsModule } from "./modules/payments/payments.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuditLogsModule,
    AuthModule,
    ProductsModule,
    BrandsModule,
    OrdersModule,
    PaymentsModule,
    StatisticsModule,
    DiscountsModule,
    VouchersModule,
    PricingModule,
    AccountsModule,
    CategoriesModule,
    PurchasesModule,
    UploadModule,
    NotificationsModule,
    MailModule,
    SmsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
