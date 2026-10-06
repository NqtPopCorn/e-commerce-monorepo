import { Module } from "@nestjs/common";
import { MockSmsService } from "./mock-sms.service";
import { SMS_SERVICE } from "./sms.interface";

@Module({
  providers: [
    MockSmsService,
    {
      provide: SMS_SERVICE,
      useExisting: MockSmsService,
    },
  ],
  exports: [SMS_SERVICE, MockSmsService],
})
export class SmsModule {}
