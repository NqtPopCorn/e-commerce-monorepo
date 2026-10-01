import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from './payment.service';

/**
 * Requires ScheduleModule.forRoot() once in AppModule.
 * Safe with several replicas: the status transition is a guarded UPDATE, so only one wins per row.
 */
@Injectable()
export class PaymentExpiryTask {
  private readonly logger = new Logger(PaymentExpiryTask.name);

  constructor(private readonly payments: PaymentService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run() {
    const n = await this.payments.expireStaleVietQr();
    if (n > 0) this.logger.log(`Expired ${n} stale VietQR payment(s)`);
  }
}
