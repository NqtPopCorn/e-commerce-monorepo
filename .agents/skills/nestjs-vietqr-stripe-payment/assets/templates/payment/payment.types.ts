import { PaymentProvider, PaymentStatus } from './payment.constants';

/**
 * Amounts are integers in the currency's smallest unit AS STRIPE DEFINES IT:
 *   VND -> dong (zero-decimal, so 50000 means 50,000 VND)
 *   USD -> cents (1999 means $19.99)
 * Storing amounts this way means no conversion when talking to Stripe or VietQR.
 */
export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string; // upper-case ISO 4217
  /** VietQR only: memo the payer must keep, used to match the incoming transfer */
  transferCode: string | null;
  /** Stripe Checkout Session id */
  providerRef: string | null;
  /** Stripe PaymentIntent id (known after checkout completes) */
  providerPaymentId: string | null;
  /** Stripe hosted checkout url, kept so a client retry can resume the same session */
  checkoutUrl: string | null;
  paidAmount: number | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewPayment = Pick<
  PaymentRecord,
  'orderId' | 'userId' | 'provider' | 'amount' | 'currency' | 'transferCode' | 'expiresAt'
>;

export type PaymentPatch = Partial<
  Pick<
    PaymentRecord,
    | 'status'
    | 'providerRef'
    | 'providerPaymentId'
    | 'checkoutUrl'
    | 'paidAmount'
    | 'paidAt'
    | 'expiresAt'
    | 'failureReason'
  >
>;

/** What the Order module must tell us. The amount ALWAYS comes from here, never from the client. */
export interface PayableOrder {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
}

export interface PayableOrderPort {
  /** Throw NotFound/Forbidden/Conflict if the order is missing, not the user's, or already paid. */
  getPayableOrder(orderId: string, userId: string): Promise<PayableOrder>;
}

/** Normalised incoming bank transfer (SePay, Casso, payOS... adapt into this). */
export interface BankTransferEvent {
  source: string; // 'sepay' | 'casso' | ...
  transactionId: string; // unique per bank transaction at the source
  direction: 'in' | 'out';
  amount: number;
  accountNumber: string;
  memo: string;
  /** Payment code already extracted by the aggregator, if any */
  code?: string | null;
  bankReference?: string | null;
  paidAt: Date;
}
