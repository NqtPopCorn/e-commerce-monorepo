# Data model and ORM adaptation

## Contents
- Tables
- Constraints that matter
- Prisma
- Mongoose / MongoDB
- Migration advice

## Tables

**payments**

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id, user_id | varchar(64) | index `(order_id, provider)` |
| provider | varchar(16) | `stripe` or `vietqr` |
| status | varchar(16) | `pending, succeeded, failed, expired, canceled, refunded` |
| amount | **bigint** | smallest unit; VND totals can exceed int32 |
| currency | char(3) | upper-case |
| transfer_code | varchar(32) NULL | **UNIQUE**; VietQR memo code |
| provider_ref | varchar(255) NULL | Stripe Checkout Session id; index `(provider, provider_ref)` |
| provider_payment_id | varchar(255) NULL | Stripe PaymentIntent id; index `(provider, provider_payment_id)` |
| checkout_url | text NULL | lets a retried request resume the same Stripe session |
| paid_amount | bigint NULL | what actually arrived |
| paid_at, expires_at | timestamptz NULL | index `(provider, status, expires_at)` for the cron |
| failure_reason | varchar(255) NULL | `amount_mismatch`, `initiate_failed`, `async_payment_failed`... |
| created_at, updated_at | timestamptz | |

**payment_events**: `id`, `source` varchar(32), `event_id` varchar(128), `created_at`, with `UNIQUE (source, event_id)`. It is the idempotency ledger for bank transactions (and can record Stripe event ids for audit). Prune rows older than your longest retry window (for example 90 days) with a scheduled job.

Optionally add `metadata jsonb` for app-specific fields; keep it out of query paths.

## Constraints that matter

- `UNIQUE (transfer_code)`: two payments sharing a memo would make reconciliation ambiguous. Nulls are allowed multiple times in Postgres/MySQL unique indexes, so Stripe rows are unaffected.
- `UNIQUE (source, event_id)`: this is what makes "insert, and if it already exists, skip" a safe dedupe under concurrent webhook retries.
- Consider a partial unique index to allow only one open payment per order and provider: `UNIQUE (order_id, provider) WHERE status = 'pending'` (Postgres). It backs up the "reuse active payment" logic against races.

## Prisma

```prisma
model Payment {
  id                String    @id @default(uuid())
  orderId           String    @map("order_id")
  userId            String    @map("user_id")
  provider          String
  status            String    @default("pending")
  amount            BigInt
  currency          String    @db.Char(3)
  transferCode      String?   @unique @map("transfer_code")
  providerRef       String?   @map("provider_ref")
  providerPaymentId String?   @map("provider_payment_id")
  checkoutUrl       String?   @map("checkout_url")
  paidAmount        BigInt?   @map("paid_amount")
  paidAt            DateTime? @map("paid_at")
  expiresAt         DateTime? @map("expires_at")
  failureReason     String?   @map("failure_reason")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  @@index([orderId, provider])
  @@index([provider, providerRef])
  @@index([provider, providerPaymentId])
  @@index([provider, status, expiresAt])
  @@map("payments")
}

model PaymentEvent {
  id        String   @id @default(uuid())
  source    String
  eventId   String   @map("event_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([source, eventId])
  @@map("payment_events")
}
```

Prisma returns `BigInt` for `BigInt` columns. Map to `number` in the repository (`Number(row.amount)`) since the domain type uses `number`; VND totals stay far below 2^53.

Repository equivalents:

```ts
// transition(): guarded update
const { count } = await prisma.payment.updateMany({
  where: { id, status: { in: from } },
  data: patch,
});
if (count === 0) return null;
return toRecord(await prisma.payment.findUnique({ where: { id } }));

// recordEvent(): unique violation is Prisma error code P2002
try { await prisma.paymentEvent.create({ data: { source, eventId } }); return true; }
catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false; throw e; }
```

In `insertWithUniqueCode` (service), also treat `P2002` as the duplicate signal.

## Mongoose / MongoDB

- Use a unique index on `transferCode` (sparse, so Stripe docs without it are fine) and on `{ source, eventId }`.
- `transition()` becomes `findOneAndUpdate({ _id, status: { $in: from } }, { $set: patch }, { new: true })`; `null` means the guard failed.
- Duplicate key errors have `code === 11000`.
- Store `amount` as a `Number` (safe up to 2^53), never as float prices.

## Migration advice

Generate a migration from the entities (TypeORM: `typeorm migration:generate`; Prisma: `prisma migrate dev`) and review it: bigint columns, the unique indexes and the partial index are the parts generators most often get wrong. Do not use `synchronize: true` against production.
