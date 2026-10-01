import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { SmsModule } from "../sms/sms.module";
import { OrderNotificationsListener } from "./listeners/order-notifications.listener";
import { OtpNotificationsListener } from "./listeners/otp-notifications.listener";

@Module({
  imports: [PrismaModule, MailModule, SmsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    OrderNotificationsListener,
    OtpNotificationsListener,
  ],
  exports: [
    NotificationsService,
    OrderNotificationsListener,
    OtpNotificationsListener,
  ],
})
export class NotificationsModule {}
