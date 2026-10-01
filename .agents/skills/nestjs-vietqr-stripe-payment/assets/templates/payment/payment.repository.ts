import { PaymentProvider, PaymentStatus } from './payment.constants';
import { NewPayment, PaymentPatch, PaymentRecord } from './payment.types';

/**
 * Persistence port. Implement it for the project's ORM
 * (payment.repository.typeorm.ts is provided; Prisma notes in references/data-model.md).
 *
 * The two methods that matter for correctness:
 *  - transition(): a single conditional UPDATE ("... WHERE id = ? AND status IN (...)").
 *    It is what makes webhook retries and duplicate deliveries harmless.
 *  - recordEvent(): relies on a UNIQUE (source, eventId) constraint.
 */
export interface PaymentRepository {
  create(data: NewPayment): Promise<PaymentRecord>;
  findById(id: string): Promise<PaymentRecord | null>;
  findByTransferCode(code: string): Promise<PaymentRecord | null>;
  findByProviderRef(provider: PaymentProvider, ref: string): Promise<PaymentRecord | null>;
  findByProviderPaymentId(provider: PaymentProvider, id: string): Promise<PaymentRecord | null>;
  /** Latest still-usable pending payment for (order, provider), if any. */
  findActive(orderId: string, provider: PaymentProvider, now: Date): Promise<PaymentRecord | null>;
  findExpiredPending(provider: PaymentProvider, now: Date, limit: number): Promise<PaymentRecord[]>;

  /** Plain update for non-status fields (providerRef, checkoutUrl...). */
  update(id: string, patch: PaymentPatch): Promise<void>;

  /**
   * Atomically apply `patch` only if the current status is in `from`.
   * Returns the updated record, or null when the guard failed (already processed / wrong state).
   */
  transition(id: string, from: PaymentStatus[], patch: PaymentPatch & { status: PaymentStatus }): Promise<PaymentRecord | null>;

  /** Insert (source, eventId). Returns false if it already exists. */
  recordEvent(source: string, eventId: string): Promise<boolean>;
  /** Compensation when processing failed after recordEvent, so the provider's retry is not ignored. */
  removeEvent(source: string, eventId: string): Promise<void>;
}
