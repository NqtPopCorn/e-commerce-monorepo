-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('COD', 'VIETQR', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'VIETQR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_code" TEXT,
    "provider_txn_id" TEXT,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

-- CreateIndex
CREATE INDEX "payment_transactions_transaction_code_idx" ON "payment_transactions"("transaction_code");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_txn_id_idx" ON "payment_transactions"("provider_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_source_event_id_key" ON "payment_events"("source", "event_id");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
