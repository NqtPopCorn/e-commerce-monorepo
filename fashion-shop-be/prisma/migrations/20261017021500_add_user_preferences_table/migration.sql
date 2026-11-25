-- CreateTable
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "waist_cm" DOUBLE PRECISION,
    "chest_cm" DOUBLE PRECISION,
    "hip_cm" DOUBLE PRECISION,
    "preferred_sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fit_preference" TEXT,
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favorite_colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disliked_colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price_preference_min" DOUBLE PRECISION,
    "price_preference_max" DOUBLE PRECISION,
    "frequent_occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
