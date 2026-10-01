import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { MailService } from "../../mail/mail.service";
import { ISmsService, SMS_SERVICE } from "../../sms/sms.interface";
import { OtpGeneratedEvent } from "../events/otp.events";

@Injectable()
export class OtpNotificationsListener {
  private readonly logger = new Logger(OtpNotificationsListener.name);

  constructor(
    private readonly mailService: MailService,
    @Inject(SMS_SERVICE) private readonly smsService: ISmsService,
  ) {}

  @OnEvent("otp.generated", { async: true })
  async handleOtpGenerated(event: OtpGeneratedEvent) {
    const { target, code, channel, purpose } = event;

    try {
      if (channel === "EMAIL") {
        await this.mailService.sendOtpEmail(target, code, purpose);
      } else {
        await this.smsService.sendOtpSms(target, code, purpose);
      }

      this.logger.log(
        `[EVENT HANDLED] Đã gửi mã OTP [${code}] tới ${channel}: ${target}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi gửi mã OTP tới ${channel}: ${target}: ${error.message}`,
        error.stack,
      );
    }
  }
}
