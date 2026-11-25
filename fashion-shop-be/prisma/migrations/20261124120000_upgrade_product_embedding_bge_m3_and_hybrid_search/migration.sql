CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

DROP INDEX IF EXISTS "products_embedding_idx";

ALTER TABLE "products" DROP COLUMN IF EXISTS "embedding";

ALTER TABLE "products"
  ADD COLUMN "embedding" vector(1024),
  ADD COLUMN "embedding_model" TEXT,
  ADD COLUMN "pattern" TEXT,
  ADD COLUMN "fit" TEXT,
  ADD COLUMN "occasion" TEXT,
  ADD COLUMN "search_vector" tsvector;

CREATE INDEX IF NOT EXISTS "products_embedding_idx"
  ON "products" USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "products_search_vector_idx"
  ON "products" USING gin ("search_vector");

