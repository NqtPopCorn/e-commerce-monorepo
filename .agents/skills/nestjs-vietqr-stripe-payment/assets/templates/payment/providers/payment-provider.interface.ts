import { PaymentProvider } from '../payment.constants';
import { PaymentRecord } from '../payment.types';

export type CheckoutInstructions =
  | {
      type: 'redirect';
      url: string;
      expiresAt: Date | null;
    }
  | {
      type: 'bank_qr';
      /** Raw EMVCo string, for clients that render their own QR */
      qrPayload: string;
      /** data:image/png;base64,... ready for <img src> */
      qrDataUrl: string;
      /** Hosted image alternative: https://img.vietqr.io/image/... */
      quickLinkUrl: string;
      bank: { bin: string; accountNo: string; accountName: string };
      amount: number;
      /** Memo the payer must not change; it is how we match the transfer */
      content: string;
      expiresAt: Date;
    };

export interface InitiateContext {
  description: string;
  customerEmail?: string;
}

export interface InitiateResult {
  providerRef?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
  instructions: CheckoutInstructions;
}

export interface PaymentProviderStrategy {
  readonly name: PaymentProvider;
  supportsCurrency(currency: string): boolean;
  /** Called once per new payment row. May hit external APIs. */
  initiate(payment: PaymentRecord, ctx: InitiateContext): Promise<InitiateResult>;
  /** Rebuild instructions for an existing pending payment (no side effects beyond rendering). */
  instructions(payment: PaymentRecord): Promise<CheckoutInstructions>;
}
