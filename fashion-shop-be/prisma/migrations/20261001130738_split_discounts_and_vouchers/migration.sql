/*
  Warnings:

  - You are about to drop the column `order_discount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `promotion_id` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the `promotion_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotion_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotion_variants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `discount_type` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_value` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Made the column `starts_at` on table `vouchers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "promotion_applications" DROP CONSTRAINT "promotion_applications_order_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_applications" DROP CONSTRAINT "promotion_applications_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_applications" DROP CONSTRAINT "promotion_applications_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_groups" DROP CONSTRAINT "promotion_groups_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_variants" DROP CONSTRAINT "promotion_variants_group_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_variants" DROP CONSTRAINT "promotion_variants_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_promotion_id_fkey";

-- DropIndex
DROP INDEX "vouchers_promotion_id_active_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "order_discount";

-- AlterTable
ALTER TABLE "vouchers" DROP COLUMN "promotion_id",
ADD COLUMN     "budget_limit" DECIMAL(12,2),
ADD COLUMN     "campaign_id" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discount_type" "DiscountType" NOT NULL,
ADD COLUMN     "discount_value" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "max_discount_value" DECIMAL(12,2),
ADD COLUMN     "min_order_amount" DECIMAL(12,2),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "starts_at" SET NOT NULL;

-- DropTable
DROP TABLE "promotion_applications";

-- DropTable
DROP TABLE "promotion_groups";

-- DropTable
DROP TABLE "promotion_variants";

-- DropTable
DROP TABLE "promotions";

-- DropEnum
DROP TYPE "PromotionApplicationScope";

-- DropEnum
DROP TYPE "PromotionApplicationType";

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "budget_limit" DECIMAL(12,2),
    "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_groups" (
    "id" SERIAL NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "max_discount_value" DECIMAL(12,2),

    CONSTRAINT "discount_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_variants" (
    "group_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,

    CONSTRAINT "discount_variants_pkey" PRIMARY KEY ("group_id","variant_id")
);

-- CreateTable
CREATE TABLE "discount_applications" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,
    "discount_name" TEXT NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "discount_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_applications" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "voucher_code" TEXT NOT NULL,
    "voucher_name" TEXT NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "voucher_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discounts_campaign_id_idx" ON "discounts"("campaign_id");

-- CreateIndex
CREATE INDEX "discounts_active_starts_at_ends_at_idx" ON "discounts"("active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "discounts_priority_idx" ON "discounts"("priority");

-- CreateIndex
CREATE INDEX "discount_groups_discount_id_sort_order_idx" ON "discount_groups"("discount_id", "sort_order");

-- CreateIndex
CREATE INDEX "discount_variants_variant_id_idx" ON "discount_variants"("variant_id");

-- CreateIndex
CREATE INDEX "discount_applications_order_id_idx" ON "discount_applications"("order_id");

-- CreateIndex
CREATE INDEX "discount_applications_discount_id_idx" ON "discount_applications"("discount_id");

-- CreateIndex
CREATE INDEX "voucher_applications_order_id_idx" ON "voucher_applications"("order_id");

-- CreateIndex
CREATE INDEX "voucher_applications_voucher_id_idx" ON "voucher_applications"("voucher_id");

-- CreateIndex
CREATE INDEX "vouchers_campaign_id_active_idx" ON "vouchers"("campaign_id", "active");

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_groups" ADD CONSTRAINT "discount_groups_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_variants" ADD CONSTRAINT "discount_variants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "discount_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_variants" ADD CONSTRAINT "discount_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_applications" ADD CONSTRAINT "discount_applications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_applications" ADD CONSTRAINT "discount_applications_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_applications" ADD CONSTRAINT "discount_applications_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_applications" ADD CONSTRAINT "voucher_applications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_applications" ADD CONSTRAINT "voucher_applications_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
