-- CreateEnum
CREATE TYPE "GenderTarget" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "target_gender" "GenderTarget" NOT NULL DEFAULT 'UNISEX';

-- CreateIndex
CREATE INDEX "products_target_gender_idx" ON "products"("target_gender");
