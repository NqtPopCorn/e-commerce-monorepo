-- DropIndex
DROP INDEX "campaigns_status_starts_at_ends_at_idx";

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "status";

-- DropEnum
DROP TYPE "CampaignStatus";

-- CreateIndex
CREATE INDEX "campaigns_starts_at_ends_at_idx" ON "campaigns"("starts_at", "ends_at");
