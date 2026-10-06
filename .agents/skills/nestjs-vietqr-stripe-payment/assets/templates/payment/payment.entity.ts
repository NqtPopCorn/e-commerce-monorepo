import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { PaymentProvider, PaymentStatus } from './payment.constants';

// Postgres returns bigint as string; convert so amounts stay numbers (VND totals can exceed int32).
const bigintTransformer = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? null : Number(v)),
};

@Entity('payments')
@Index(['orderId', 'provider'])
@Index(['provider', 'providerRef'])
@Index(['provider', 'providerPaymentId'])
@Index(['provider', 'status', 'expiresAt'])
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'varchar', length: 64 }) orderId!: string;
  @Column({ type: 'varchar', length: 64 }) userId!: string;

  @Column({ type: 'varchar', length: 16 }) provider!: PaymentProvider;
  @Column({ type: 'varchar', length: 16, default: PaymentStatus.PENDING }) status!: PaymentStatus;

  @Column({ type: 'bigint', transformer: bigintTransformer }) amount!: number;
  @Column({ type: 'varchar', length: 3 }) currency!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, nullable: true }) transferCode!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true }) providerRef!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) providerPaymentId!: string | null;
  @Column({ type: 'text', nullable: true }) checkoutUrl!: string | null;

  @Column({ type: 'bigint', nullable: true, transformer: bigintTransformer }) paidAmount!: number | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) expiresAt!: Date | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) failureReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}

/** Idempotency ledger for webhooks / bank transactions. */
@Entity('payment_events')
@Unique(['source', 'eventId'])
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 32 }) source!: string; // 'stripe' | 'sepay' | ...
  @Column({ type: 'varchar', length: 128 }) eventId!: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
