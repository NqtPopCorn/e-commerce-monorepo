-- AlterTable
ALTER TABLE "products" ADD COLUMN     "embedding" vector(768),
ADD COLUMN     "embedding_text" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_embedding_idx" ON "products" USING hnsw ("embedding" vector_cosine_ops);
