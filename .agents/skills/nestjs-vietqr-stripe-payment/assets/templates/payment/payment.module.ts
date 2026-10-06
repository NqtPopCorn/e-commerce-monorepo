import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { PaymentController } from './payment.controller';
import { paymentConfig } from './payment.config';
import { PAYMENT_REPOSITORY, STRIPE_CLIENT } from './payment.constants';
import { PaymentEntity, PaymentEventEntity } from './payment.entity';
import { PaymentExpiryTask } from './payment-expiry.task';
import { TypeOrmPaymentRepository } from './payment.repository.typeorm';
import { PaymentService } from './payment.service';
import { StripeProvider } from './providers/stripe.provider';
import { VietQrProvider } from './providers/vietqr.provider';
import { SepayWebhookController } from './webhooks/sepay-webhook.controller';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';

/**
 * App-level prerequisites:
 *   - NestFactory.create(AppModule, { rawBody: true })           (Stripe signature check)
 *   - EventEmitterModule.forRoot()                               (payment.succeeded etc.)
 *   - ScheduleModule.forRoot()                                   (expiry cron)
 *   - Provide PAYABLE_ORDER_PORT from your Order module (see README in SKILL.md)
 *
 * PAYABLE_ORDER_PORT is intentionally not provided here: import the module that exports it,
 * or add { provide: PAYABLE_ORDER_PORT, useExisting: OrderService } to this module's providers.
 */
@Module({
  imports: [
    ConfigModule.forFeature(paymentConfig),
    TypeOrmModule.forFeature([PaymentEntity, PaymentEventEntity]),
  ],
  controllers: [PaymentController, StripeWebhookController, SepayWebhookController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [paymentConfig.KEY],
      useFactory: (cfg: ReturnType<typeof paymentConfig>) =>
        // API version defaults to the one pinned by the installed stripe-node release.
        new Stripe(cfg.stripe.secretKey, { maxNetworkRetries: 2 }),
    },
    { provide: PAYMENT_REPOSITORY, useClass: TypeOrmPaymentRepository },
    StripeProvider,
    VietQrProvider,
    PaymentService,
    PaymentExpiryTask,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
