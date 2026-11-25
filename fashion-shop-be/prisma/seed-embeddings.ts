import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  buildProductEmbeddingText,
  buildProductSearchText,
} from "../src/modules/products/embedding.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OLLAMA_BASE_URL = (
  process.env.OLLAMA_BASE_URL || "http://localhost:11434"
).replace(/\/+$/, "");
const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "bge-m3";
const CONCURRENCY = 8;

async function fetchEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Ollama error HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { embedding: number[] };
  if (!json.embedding || json.embedding.length === 0) {
    throw new Error("Ollama returned empty embedding");
  }
  return json.embedding;
}

async function main() {
  console.log("=== BẮT ĐẦU INDEX EMBEDDING & SEARCH VECTOR CHO SẢN PHẨM ===");
  console.log(`Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log(`Model: ${OLLAMA_EMBEDDING_MODEL} (Concurrency: ${CONCURRENCY})`);

  const products = await prisma.product.findMany({
    include: {
      category: { include: { parent: true } },
      brand: true,
      variants: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`Tìm thấy tổng cộng ${products.length} sản phẩm cần xử lý.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (product) => {
        const embeddingText = buildProductEmbeddingText(product);
        const searchText = buildProductSearchText(product);

        try {
          const vector = await fetchEmbedding(embeddingText);
          const vectorString = `[${vector.join(",")}]`;

          await prisma.$executeRawUnsafe(
            `UPDATE products
             SET embedding = $1::vector,
                 embedding_text = $2,
                 embedding_model = $3,
                 search_vector = to_tsvector('simple', unaccent($4)),
                 updated_at = NOW()
             WHERE id = $5`,
            vectorString,
            embeddingText,
            OLLAMA_EMBEDDING_MODEL,
            searchText,
            product.id,
          );

          successCount++;
        } catch (err: any) {
          failCount++;
          console.error(
            `[FAIL] #${product.id} - ${product.name}: ${err?.message || err}`,
          );
        }
      }),
    );

    const processed = Math.min(i + CONCURRENCY, products.length);
    if (processed % 80 === 0 || processed === products.length) {
      console.log(
        `[${processed}/${products.length}] Thành công: ${successCount}, Thất bại: ${failCount}`,
      );
    }
  }

  const stats = await pool.query<{
    embedding_model: string | null;
    total: number;
    has_embedding: number;
    has_search_vector: number;
  }>(
    `SELECT embedding_model,
            count(*)::int AS total,
            count(embedding)::int AS has_embedding,
            count(search_vector)::int AS has_search_vector
     FROM products
     GROUP BY embedding_model`,
  );

  console.log("\n=== KẾT QUẢ INDEX HOÀN TẤT ===");
  console.log(`- Thành công: ${successCount}`);
  console.log(`- Thất bại: ${failCount}`);
  console.table(stats.rows);
}

main()
  .catch((e) => {
    console.error("Lỗi thực thi index:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
