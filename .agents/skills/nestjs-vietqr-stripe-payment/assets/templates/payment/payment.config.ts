import { registerAs } from '@nestjs/config';

export const paymentConfig = registerAs('payment', () => ({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    successUrl: process.env.STRIPE_SUCCESS_URL ?? '',
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? '',
    sessionTtlMinutes: Number(process.env.STRIPE_SESSION_TTL_MINUTES ?? 60), // Stripe allows 30 min - 24 h
  },
  vietqr: {
    bankBin: process.env.VIETQR_BANK_BIN ?? '',
    accountNo: process.env.VIETQR_ACCOUNT_NO ?? '',
    accountName: process.env.VIETQR_ACCOUNT_NAME ?? '',
    codePrefix: process.env.VIETQR_CODE_PREFIX ?? 'PAY',
    ttlMinutes: Number(process.env.VIETQR_TTL_MINUTES ?? 15),
  },
  sepay: {
    webhookApiKey: process.env.SEPAY_WEBHOOK_API_KEY ?? '',
  },
}));

export type PaymentConfig = ReturnType<typeof paymentConfig>;

/** Fail fast at provider construction instead of at the first customer payment. */
export function requireConfig(section: string, values: Record<string, string>): void {
  const missing = Object.entries(values).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`Payment config "${section}" is missing: ${missing.join(', ')}`);
  }
}
