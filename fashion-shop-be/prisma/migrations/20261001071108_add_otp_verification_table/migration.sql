-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('FORGOT_PASSWORD', 'PHONE_VERIFICATION', 'ORDER_CONFIRMATION', 'LOGIN');

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "target" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OtpType" NOT NULL DEFAULT 'FORGOT_PASSWORD',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_target_type_used_idx" ON "otp_verifications"("target", "type", "used");
