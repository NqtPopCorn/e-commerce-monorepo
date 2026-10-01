import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { PaymentProvider, PaymentStatus } from './payment.constants';
import { PaymentEntity, PaymentEventEntity } from './payment.entity';
import { PaymentRepository } from './payment.repository';
import { NewPayment, PaymentPatch, PaymentRecord } from './payment.types';

const isUniqueViolation = (e: any): boolean =>
  e?.code === '23505' || e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062 || e?.driverError?.code === '23505';

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(PaymentEventEntity) private readonly events: Repository<PaymentEventEntity>,
  ) {}

  create(data: NewPayment): Promise<PaymentRecord> {
    return this.payments.save(this.payments.create({ ...data, status: PaymentStatus.PENDING }));
  }

  findById(id: string) {
    return this.payments.findOne({ where: { id } });
  }

  findByTransferCode(code: string) {
    return this.payments.findOne({ where: { transferCode: code } });
  }

  findByProviderRef(provider: PaymentProvider, ref: string) {
    return this.payments.findOne({ where: { provider, providerRef: ref } });
  }

  findByProviderPaymentId(provider: PaymentProvider, id: string) {
    return this.payments.findOne({ where: { provider, providerPaymentId: id } });
  }

  findActive(orderId: string, provider: PaymentProvider, now: Date) {
    return this.payments.findOne({
      where: { orderId, provider, status: PaymentStatus.PENDING, expiresAt: MoreThan(now) },
      order: { createdAt: 'DESC' },
    });
  }

  findExpiredPending(provider: PaymentProvider, now: Date, limit: number) {
    return this.payments.find({
      where: { provider, status: PaymentStatus.PENDING, expiresAt: LessThanOrEqual(now) },
      take: limit,
    });
  }

  async update(id: string, patch: PaymentPatch): Promise<void> {
    await this.payments.update({ id }, patch);
  }

  async transition(id: string, from: PaymentStatus[], patch: PaymentPatch & { status: PaymentStatus }) {
    const res = await this.payments
      .createQueryBuilder()
      .update(PaymentEntity)
      .set(patch)
      .where('id = :id AND status IN (:...from)', { id, from })
      .execute();
    if (!res.affected) return null;
    return this.findById(id);
  }

  async recordEvent(source: string, eventId: string): Promise<boolean> {
    try {
      await this.events.insert({ source, eventId });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false;
      throw e;
    }
  }

  async removeEvent(source: string, eventId: string): Promise<void> {
    await this.events.delete({ source, eventId });
  }
}
