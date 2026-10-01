import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { paymentConfig, requireConfig } from '../payment.config';
import { PaymentProvider, STRIPE_CLIENT } from '../payment.constants';
import { PaymentRecord } from '../payment.types';
import {
  CheckoutInstructions,
  InitiateContext,
  InitiateResult,
  PaymentProviderStrategy,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProviderStrategy {
  readonly name = PaymentProvider.STRIPE;
  private readonly cfg: ConfigType<typeof paymentConfig>['stripe'];

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(paymentConfig.KEY) config: ConfigType<typeof paymentConfig>,
  ) {
    this.cfg = config.stripe;
    requireConfig('stripe', {
      STRIPE_SECRET_KEY: this.cfg.secretKey,
      STRIPE_WEBHOOK_SECRET: this.cfg.webhookSecret,
      STRIPE_SUCCESS_URL: this.cfg.successUrl,
      STRIPE_CANCEL_URL: this.cfg.cancelUrl,
    });
  }

  get ttlMinutes(): number {
    return this.cfg.sessionTtlMinutes;
  }

  supportsCurrency(): boolean {
    return true; // Stripe validates the currency itself
  }

  async initiate(payment: PaymentRecord, ctx: InitiateContext): Promise<InitiateResult> {
    const expiresAt = payment.expiresAt ?? new Date(Date.now() + this.cfg.sessionTtlMinutes * 60_000);
    const meta = { paymentId: payment.id, orderId: payment.orderId };

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        client_reference_id: payment.id,
        customer_email: ctx.customerEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: payment.currency.toLowerCase(),
              unit_amount: payment.amount, // already in Stripe's smallest unit (VND = dong)
              product_data: { name: ctx.description },
            },
          },
        ],
        metadata: meta,
        payment_intent_data: { metadata: meta },
        success_url: this.cfg.successUrl.replace('{PAYMENT_ID}', payment.id),
        cancel_url: this.cfg.cancelUrl,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      },
      // One session per payment row, even if this call is retried after a network error.
      { idempotencyKey: `checkout-session:${payment.id}` },
    );

    if (!session.url) throw new Error('Stripe did not return a checkout url');

    return {
      providerRef: session.id,
      checkoutUrl: session.url,
      expiresAt,
      instructions: { type: 'redirect', url: session.url, expiresAt },
    };
  }

  async instructions(payment: PaymentRecord): Promise<CheckoutInstructions> {
    if (!payment.checkoutUrl) throw new Error(`Stripe payment ${payment.id} has no checkout url`);
    return { type: 'redirect', url: payment.checkoutUrl, expiresAt: payment.expiresAt };
  }

  /** Full refund of the underlying PaymentIntent. Final status is set by the charge.refunded webhook. */
  async refund(payment: PaymentRecord, reason?: Stripe.RefundCreateParams.Reason): Promise<void> {
    if (!payment.providerPaymentId) throw new Error('Payment has no PaymentIntent to refund');
    await this.stripe.refunds.create(
      { payment_intent: payment.providerPaymentId, reason },
      { idempotencyKey: `refund:${payment.id}` },
    );
  }
}
