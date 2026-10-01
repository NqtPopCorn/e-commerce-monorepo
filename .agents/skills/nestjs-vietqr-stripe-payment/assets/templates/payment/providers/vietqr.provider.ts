import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { paymentConfig, requireConfig } from '../payment.config';
import { PaymentProvider } from '../payment.constants';
import { PaymentRecord } from '../payment.types';
import { buildVietQrPayload } from '../utils/vietqr-emv';
import {
  CheckoutInstructions,
  InitiateContext,
  InitiateResult,
  PaymentProviderStrategy,
} from './payment-provider.interface';

@Injectable()
export class VietQrProvider implements PaymentProviderStrategy {
  readonly name = PaymentProvider.VIETQR;
  private readonly cfg: ConfigType<typeof paymentConfig>['vietqr'];

  constructor(@Inject(paymentConfig.KEY) config: ConfigType<typeof paymentConfig>) {
    this.cfg = config.vietqr;
    requireConfig('vietqr', {
      VIETQR_BANK_BIN: this.cfg.bankBin,
      VIETQR_ACCOUNT_NO: this.cfg.accountNo,
      VIETQR_ACCOUNT_NAME: this.cfg.accountName,
    });
  }

  get ttlMinutes(): number {
    return this.cfg.ttlMinutes;
  }

  get codePrefix(): string {
    return this.cfg.codePrefix;
  }

  get accountNo(): string {
    return this.cfg.accountNo;
  }

  supportsCurrency(currency: string): boolean {
    return currency.toUpperCase() === 'VND';
  }

  async initiate(payment: PaymentRecord, _ctx: InitiateContext): Promise<InitiateResult> {
    // Nothing to call remotely: the QR is generated locally and is fully determined by the payment row.
    const instructions = await this.instructions(payment);
    return { instructions, expiresAt: payment.expiresAt ?? undefined };
  }

  async instructions(payment: PaymentRecord): Promise<CheckoutInstructions> {
    if (!payment.transferCode || !payment.expiresAt) {
      throw new Error(`VietQR payment ${payment.id} has no transfer code / expiry`);
    }
    const { bankBin, accountNo, accountName } = this.cfg;

    const qrPayload = buildVietQrPayload({
      bin: bankBin,
      accountNo,
      amount: payment.amount,
      addInfo: payment.transferCode,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
    });

    const quickLinkUrl =
      `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png` +
      `?amount=${payment.amount}&addInfo=${encodeURIComponent(payment.transferCode)}` +
      `&accountName=${encodeURIComponent(accountName)}`;

    return {
      type: 'bank_qr',
      qrPayload,
      qrDataUrl,
      quickLinkUrl,
      bank: { bin: bankBin, accountNo, accountName },
      amount: payment.amount,
      content: payment.transferCode,
      expiresAt: payment.expiresAt,
    };
  }
}
