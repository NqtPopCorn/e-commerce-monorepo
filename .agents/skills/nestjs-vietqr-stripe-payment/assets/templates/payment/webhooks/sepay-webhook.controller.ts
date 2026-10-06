import { BadRequestException, Controller, Headers, HttpCode, Inject, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { paymentConfig } from '../payment.config';
import { PaymentService } from '../payment.service';
import { BankTransferEvent } from '../payment.types';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** SePay timestamps are Vietnam local time without offset, e.g. "2023-03-25 14:02:37". */
function parseVnTime(s: unknown): Date {
  if (typeof s !== 'string') return new Date();
  const d = new Date(s.replace(' ', 'T') + '+07:00');
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// TODO(project): mark this route public (skip auth guards / CSRF / throttling).
@Controller('payments/webhooks')
export class SepayWebhookController {
  constructor(
    @Inject(paymentConfig.KEY) private readonly config: ConfigType<typeof paymentConfig>,
    private readonly payments: PaymentService,
  ) {}

  @Post('sepay')
  @HttpCode(200)
  async handle(@Headers('authorization') auth: string | undefined, @Body() body: Record<string, unknown>) {
    // SePay "API Key" mode sends:  Authorization: Apikey <your key>
    const expected = this.config.sepay.webhookApiKey;
    if (!expected) throw new UnauthorizedException('SEPAY_WEBHOOK_API_KEY not configured');
    if (!auth || !auth.startsWith('Apikey ') || !safeEqual(auth.slice(7), expected)) {
      throw new UnauthorizedException();
    }

    // Parse leniently: aggregators add fields over time, so no forbidNonWhitelisted DTO here.
    const id = body.id;
    const amount = Number(body.transferAmount);
    if ((typeof id !== 'number' && typeof id !== 'string') || !Number.isFinite(amount)) {
      throw new BadRequestException('Unexpected payload');
    }

    const tx: BankTransferEvent = {
      source: 'sepay',
      transactionId: String(id),
      direction: body.transferType === 'out' ? 'out' : 'in',
      amount,
      accountNumber: String(body.accountNumber ?? ''),
      memo: String(body.content ?? body.description ?? ''),
      code: typeof body.code === 'string' && body.code ? body.code.toUpperCase() : null,
      bankReference: typeof body.referenceCode === 'string' ? body.referenceCode : null,
      paidAt: parseVnTime(body.transactionDate),
    };

    await this.payments.handleBankTransfer(tx);

    // SePay treats only HTTP 200/201 with {"success": true} as delivered.
    return { success: true };
  }
}
