import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';
import { paymentConfig } from '../payment.config';
import { STRIPE_CLIENT } from '../payment.constants';
import { PaymentService } from '../payment.service';

// TODO(project): mark this route public (skip auth guards, CSRF, rate limiting).
// Stripe authenticates itself with the signature header.
@Controller('payments/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(paymentConfig.KEY) private readonly config: ConfigType<typeof paymentConfig>,
    private readonly payments: PaymentService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handle(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    // The signature covers the exact bytes Stripe sent. A re-serialised JSON body will never verify,
    // hence `rawBody: true` in NestFactory.create().
    if (!req.rawBody || !signature) throw new BadRequestException('Missing body or signature');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, signature, this.config.stripe.webhookSecret);
    } catch (e) {
      this.logger.warn(`Rejected Stripe webhook: ${(e as Error).message}`);
      throw new BadRequestException('Invalid signature');
    }

    // Errors bubble up as 500 so Stripe retries; handlers are idempotent so retries are safe.
    await this.payments.handleStripeEvent(event);
    return { received: true };
  }
}
