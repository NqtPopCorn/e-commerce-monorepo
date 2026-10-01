import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  PAYABLE_ORDER_PORT,
  PAYMENT_FAILED_EVENT,
  PAYMENT_REFUNDED_EVENT,
  PAYMENT_REPOSITORY,
  PAYMENT_SUCCEEDED_EVENT,
  PaymentProvider,
  PaymentStatus,
  PaymentSucceededEvent,
} from './payment.constants';
import { PaymentRepository } from './payment.repository';
import { BankTransferEvent, PayableOrderPort, PaymentRecord } from './payment.types';
import { CheckoutInstructions, PaymentProviderStrategy } from './providers/payment-provider.interface';
import { StripeProvider } from './providers/stripe.provider';
import { VietQrProvider } from './providers/vietqr.provider';
import { extractTransferCode, generateTransferCode } from './utils/transfer-code';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providers: Map<PaymentProvider, PaymentProviderStrategy>;

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: PaymentRepository,
    @Inject(PAYABLE_ORDER_PORT) private readonly orders: PayableOrderPort,
    private readonly events: EventEmitter2,
    private readonly stripe: StripeProvider,
    private readonly vietqr: VietQrProvider,
  ) {
    this.providers = new Map<PaymentProvider, PaymentProviderStrategy>([
      [PaymentProvider.STRIPE, stripe],
      [PaymentProvider.VIETQR, vietqr],
    ]);
  }

  // ---------------------------------------------------------------- create / read

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const provider = this.providers.get(dto.provider);
    if (!provider) throw new BadRequestException(`Unsupported provider: ${dto.provider}`);

    const order = await this.orders.getPayableOrder(dto.orderId, userId);
    if (!provider.supportsCurrency(order.currency)) {
      throw new BadRequestException(`${dto.provider} does not support ${order.currency}`);
    }

    // Client retries / double clicks reuse the open payment instead of creating a second one.
    const existing = await this.repo.findActive(order.id, dto.provider, new Date());
    if (existing) {
      return { payment: existing, instructions: await provider.instructions(existing) };
    }

    const ttlMin = dto.provider === PaymentProvider.STRIPE ? this.stripe.ttlMinutes : this.vietqr.ttlMinutes;
    const payment = await this.insertWithUniqueCode({
      orderId: order.id,
      userId: order.userId,
      provider: dto.provider,
      amount: order.amount,
      currency: order.currency.toUpperCase(),
      expiresAt: new Date(Date.now() + ttlMin * 60_000),
    });

    try {
      const result = await provider.initiate(payment, {
        description: order.description,
        customerEmail: order.customerEmail,
      });
      await this.repo.update(payment.id, {
        providerRef: result.providerRef ?? null,
        checkoutUrl: result.checkoutUrl ?? null,
        expiresAt: result.expiresAt ?? payment.expiresAt,
      });
      return { payment: (await this.repo.findById(payment.id)) ?? payment, instructions: result.instructions };
    } catch (err) {
      await this.repo.transition(payment.id, [PaymentStatus.PENDING], {
        status: PaymentStatus.FAILED,
        failureReason: 'initiate_failed',
      });
      throw err;
    }
  }

  async getForUser(paymentId: string, userId: string) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

    const instructions: CheckoutInstructions | null =
      payment.status === PaymentStatus.PENDING
        ? await this.providers.get(payment.provider)!.instructions(payment)
        : null;
    return { payment, instructions };
  }

  async refundStripe(paymentId: string): Promise<void> {
    const payment = await this.repo.findById(paymentId);
    if (!payment || payment.provider !== PaymentProvider.STRIPE) throw new NotFoundException();
    if (payment.status !== PaymentStatus.SUCCEEDED) throw new BadRequestException('Only succeeded payments can be refunded');
    await this.stripe.refund(payment);
    // Status flips to REFUNDED when Stripe sends charge.refunded.
  }

  // ---------------------------------------------------------------- Stripe webhook

  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        // Card payments are 'paid' right away; delayed methods arrive later via async_payment_*.
        if (s.payment_status === 'paid') await this.stripeSessionPaid(s);
        return;
      }
      case 'checkout.session.async_payment_succeeded':
        return this.stripeSessionPaid(event.data.object as Stripe.Checkout.Session);

      case 'checkout.session.async_payment_failed': {
        const s = event.data.object as Stripe.Checkout.Session;
        return this.failBySession(s.id, 'async_payment_failed');
      }
      case 'checkout.session.expired': {
        const s = event.data.object as Stripe.Checkout.Session;
        const p = await this.repo.findByProviderRef(PaymentProvider.STRIPE, s.id);
        if (p) await this.repo.transition(p.id, [PaymentStatus.PENDING], { status: PaymentStatus.EXPIRED });
        return;
      }
      case 'charge.refunded': {
        const c = event.data.object as Stripe.Charge;
        const piId = typeof c.payment_intent === 'string' ? c.payment_intent : c.payment_intent?.id;
        if (!piId || !c.refunded) return; // partial refunds: handle separately if you support them
        const p = await this.repo.findByProviderPaymentId(PaymentProvider.STRIPE, piId);
        if (!p) return;
        const updated = await this.repo.transition(p.id, [PaymentStatus.SUCCEEDED], { status: PaymentStatus.REFUNDED });
        if (updated) this.events.emit(PAYMENT_REFUNDED_EVENT, { paymentId: p.id, orderId: p.orderId });
        return;
      }
      default:
        return; // acknowledge everything else so Stripe stops retrying
    }
  }

  private async stripeSessionPaid(s: Stripe.Checkout.Session): Promise<void> {
    const payment =
      (await this.repo.findByProviderRef(PaymentProvider.STRIPE, s.id)) ??
      (s.client_reference_id ? await this.repo.findById(s.client_reference_id) : null);
    if (!payment) {
      this.logger.error(`Stripe session ${s.id} paid but no matching payment`);
      return;
    }
    const paid = s.amount_total ?? 0;
    if (paid !== payment.amount || s.currency?.toUpperCase() !== payment.currency) {
      this.logger.error(`Stripe amount mismatch for ${payment.id}: expected ${payment.amount} ${payment.currency}, got ${paid} ${s.currency}`);
      await this.repo.transition(payment.id, [PaymentStatus.PENDING], {
        status: PaymentStatus.FAILED,
        failureReason: 'amount_mismatch',
        paidAmount: paid,
      });
      return;
    }
    const piId = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? null;
    await this.markSucceeded(payment, { paidAmount: paid, providerPaymentId: piId });
  }

  private async failBySession(sessionId: string, reason: string): Promise<void> {
    const p = await this.repo.findByProviderRef(PaymentProvider.STRIPE, sessionId);
    if (!p) return;
    const updated = await this.repo.transition(p.id, [PaymentStatus.PENDING], { status: PaymentStatus.FAILED, failureReason: reason });
    if (updated) this.events.emit(PAYMENT_FAILED_EVENT, { paymentId: p.id, orderId: p.orderId, reason });
  }

  // ---------------------------------------------------------------- bank transfer (VietQR)

  async handleBankTransfer(tx: BankTransferEvent): Promise<void> {
    if (tx.direction !== 'in') return;
    if (tx.accountNumber !== this.vietqr.accountNo) {
      this.logger.warn(`Ignoring transfer ${tx.transactionId}: account ${tx.accountNumber} is not ours`);
      return;
    }

    const first = await this.repo.recordEvent(tx.source, tx.transactionId);
    if (!first) return; // duplicate delivery

    try {
      const code = tx.code ?? extractTransferCode(tx.memo, this.vietqr.codePrefix);
      const payment = code ? await this.repo.findByTransferCode(code) : null;
      if (!payment) {
        // Still ACK (return normally): retrying will not help. Needs manual reconciliation.
        this.logger.warn(`Unmatched transfer ${tx.source}:${tx.transactionId} amount=${tx.amount} memo="${tx.memo}"`);
        return;
      }
      if (tx.amount < payment.amount) {
        this.logger.warn(`Underpaid ${payment.id}: expected ${payment.amount}, received ${tx.amount}. Left pending.`);
        return;
      }
      if (tx.amount > payment.amount) {
        this.logger.warn(`Overpaid ${payment.id}: expected ${payment.amount}, received ${tx.amount}. Refund the difference manually.`);
      }
      if (payment.status === PaymentStatus.EXPIRED) {
        this.logger.warn(`Late transfer for expired payment ${payment.id}; accepting because the money arrived.`);
      }
      await this.markSucceeded(payment, { paidAmount: tx.amount, paidAt: tx.paidAt }, [
        PaymentStatus.PENDING,
        PaymentStatus.EXPIRED,
      ]);
    } catch (err) {
      await this.repo.removeEvent(tx.source, tx.transactionId); // let the provider retry
      throw err;
    }
  }

  /** Cron entry point: VietQR has no provider-side expiry, so we expire rows ourselves. */
  async expireStaleVietQr(): Promise<number> {
    const stale = await this.repo.findExpiredPending(PaymentProvider.VIETQR, new Date(), 200);
    let n = 0;
    for (const p of stale) {
      if (await this.repo.transition(p.id, [PaymentStatus.PENDING], { status: PaymentStatus.EXPIRED })) n++;
    }
    return n;
  }

  // ---------------------------------------------------------------- shared

  private async markSucceeded(
    payment: PaymentRecord,
    patch: { paidAmount: number; paidAt?: Date; providerPaymentId?: string | null },
    from: PaymentStatus[] = [PaymentStatus.PENDING],
  ): Promise<void> {
    const paidAt = patch.paidAt ?? new Date();
    const updated = await this.repo.transition(payment.id, from, {
      status: PaymentStatus.SUCCEEDED,
      paidAmount: patch.paidAmount,
      paidAt,
      ...(patch.providerPaymentId ? { providerPaymentId: patch.providerPaymentId } : {}),
    });
    if (!updated) return; // someone else already finalised it: nothing to do, nothing to emit

    const evt: PaymentSucceededEvent = {
      paymentId: updated.id,
      orderId: updated.orderId,
      provider: updated.provider,
      amount: updated.amount,
      currency: updated.currency,
      paidAt,
    };
    this.events.emit(PAYMENT_SUCCEEDED_EVENT, evt);
  }

  private async insertWithUniqueCode(base: {
    orderId: string;
    userId: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    expiresAt: Date;
  }): Promise<PaymentRecord> {
    if (base.provider !== PaymentProvider.VIETQR) {
      return this.repo.create({ ...base, transferCode: null });
    }
    // 32^10 possibilities makes collisions near-impossible; the UNIQUE index is the real guard.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.repo.create({ ...base, transferCode: generateTransferCode(this.vietqr.codePrefix) });
      } catch (e: any) {
        const dup = e?.code === '23505' || e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062;
        if (!dup || attempt === 2) throw e;
      }
    }
    throw new Error('unreachable');
  }
}
