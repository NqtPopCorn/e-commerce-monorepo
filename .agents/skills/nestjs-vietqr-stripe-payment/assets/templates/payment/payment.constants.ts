export enum PaymentProvider {
  STRIPE = 'stripe',
  VIETQR = 'vietqr',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

/** Injection tokens */
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
export const PAYABLE_ORDER_PORT = Symbol('PAYABLE_ORDER_PORT');
export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

/** Domain events emitted through @nestjs/event-emitter */
export const PAYMENT_SUCCEEDED_EVENT = 'payment.succeeded';
export const PAYMENT_FAILED_EVENT = 'payment.failed';
export const PAYMENT_REFUNDED_EVENT = 'payment.refunded';

export interface PaymentSucceededEvent {
  paymentId: string;
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  paidAt: Date;
}
