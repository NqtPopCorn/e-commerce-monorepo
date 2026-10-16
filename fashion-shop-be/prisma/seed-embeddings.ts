import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buildProductEmbeddingText } from "../src/modules/products/embedding.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OLLAMA_BASE_URL = (
  process.env.OLLAMA_BASE_URL || "http://localhost:11434"
).replace(/\/+$/, "");
const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

async function fetchEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    }),
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
  console.log("=== BẮT ĐẦU INDEX EMBEDDING CHO SẢN PHẨM ===");
  console.log(`Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log(`Model: ${OLLAMA_EMBEDDING_MODEL}`);

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

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const text = buildProductEmbeddingText(product);

    try {
      const vector = await fetchEmbedding(text);
      const vectorString = `[${vector.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `UPDATE products SET embedding = $1::vector, embedding_text = $2, updated_at = NOW() WHERE id = $3`,
        vectorString,
        text,
        product.id,
      );

      successCount++;
      console.log(
        `[${i + 1}/${products.length}] [OK] #${product.id} - ${product.name} (vector dims: ${vector.length})`,
      );
    } catch (err: any) {
      failCount++;
      console.error(
        `[${i + 1}/${products.length}] [FAIL] #${product.id} - ${product.name}: ${err?.message || err}`,
      );
    }
  }

  console.log("\n=== KẾT QUẢ INDEX HOÀN TẤT ===");
  console.log(`- Thành công: ${successCount}`);
  console.log(`- Thất bại: ${failCount}`);
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
