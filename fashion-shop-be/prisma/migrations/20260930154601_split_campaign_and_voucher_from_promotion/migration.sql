/*
  Warnings:

  - You are about to drop the column `code` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `max_discount_value` on the `promotions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PromotionApplicationType" AS ENUM ('AUTO', 'VOUCHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- DropIndex
DROP INDEX "promotions_code_key";

-- DropIndex
DROP INDEX "promotions_kind_active_starts_at_ends_at_idx";

-- DropIndex
DROP INDEX "promotions_kind_priority_idx";

-- AlterTable
ALTER TABLE "promotion_groups" ADD COLUMN     "max_discount_value" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "code",
DROP COLUMN "discountType",
DROP COLUMN "discountValue",
DROP COLUMN "kind",
DROP COLUMN "max_discount_value",
ADD COLUMN     "application_type" "PromotionApplicationType" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "budget_limit" DECIMAL(12,2),
ADD COLUMN     "campaign_id" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "PromotionKind";

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "budget_limit" DECIMAL(12,2),
    "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" SERIAL NOT NULL,
    "promotion_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_customer" INTEGER DEFAULT 1,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_status_starts_at_ends_at_idx" ON "campaigns"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_code_idx" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_promotion_id_active_idx" ON "vouchers"("promotion_id", "active");

-- CreateIndex
CREATE INDEX "promotions_campaign_id_idx" ON "promotions"("campaign_id");

-- CreateIndex
CREATE INDEX "promotions_application_type_active_starts_at_ends_at_idx" ON "promotions"("application_type", "active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "promotions_application_type_priority_idx" ON "promotions"("application_type", "priority");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
