-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
