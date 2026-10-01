import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";
import { PromotionsModule } from "../promotions/promotions.module";
import { NotificationsModule } from "../notifications/notifications.module";

import { MailModule } from "../mail/mail.module";
import { SmsModule } from "../sms/sms.module";

@Module({
  imports: [PromotionsModule, NotificationsModule, MailModule, SmsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, AdminOrdersService],
  exports: [OrdersService, AdminOrdersService],
})
export class OrdersModule {}
