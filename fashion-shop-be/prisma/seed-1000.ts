import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient, GenderTarget, ProductFit } from "@prisma/client";
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

const HM_SEED_JSON_PATH = path.resolve(
  "H:/Code/PET/customer-shop-assistant/data/hm_seed_1000.json",
);

interface HmVariantInput {
  sku: string;
  barcode: string;
  size: string;
  color: string;
  colorHex: string;
  imageUrl: string;
  listPrice: number;
  sellingPrice: number;
  stock: number;
  weight: number;
}

interface HmImageInput {
  url: string;
  altText: string;
  sortOrder: number;
}

interface HmProductInput {
  hmProductCode: string;
  name: string;
  slug: string;
  categoryName: string;
  brandName: string;
  targetGender: "MALE" | "FEMALE" | "UNISEX";
  material: string;
  careInstructions: string;
  season: string;
  provider: string;
  description: string;
  images: HmImageInput[];
  variants: HmVariantInput[];
}

const BRANDS = [
  { name: "Uniqlo", slug: "uniqlo" },
  { name: "Zara", slug: "zara" },
  { name: "H&M", slug: "hm" },
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
];

const CATEGORY_TREE: Array<{ name: string; children: string[] }> = [
  {
    name: "Áo nam & nữ",
    children: ["Áo thun", "Áo polo", "Áo sơ mi", "Áo khoác"],
  },
  {
    name: "Quần nam & nữ",
    children: ["Quần jeans", "Quần kaki", "Quần short", "Quần âu"],
  },
  {
    name: "Váy & Đầm",
    children: ["Váy liền", "Chân váy", "Đầm dạ hội"],
  },
  {
    name: "Phụ kiện thời trang",
    children: ["Mũ nón", "Thắt lưng", "Túi xách"],
  },
];

const FIT_COMMENTS: Record<ProductFit, string[]> = {
  TIGHT: [
    "Chất vải đẹp nhưng form hơi ôm sát so với bảng size, ai thích mặc thoải mái nên tăng 1 size nhé.",
    "Form áo hơi nhỏ/chật ở phần vai và ngực, mình khuyên nên lấy lớn hơn 1 size sẽ vừa đẹp.",
    "Đồ may chắc chắn nhưng phom ôm (tight), bạn nào có bụng hoặc thích rộng rãi nhớ cộng thêm 1 size.",
  ],
  LOOSE: [
    "Form rộng rãi thoải mái hơn bình thường, nếu bạn thích mặc vừa vặn ôm người thì nên lùi 1 size.",
    "Phom dáng khá rộng (loose/oversize), mặc lên giấu dáng tốt, ai người nhỏ nên giảm 1 size nhé.",
    "Áo form to rộng hơn chuẩn một chút, thích mặc gọn người thì chọn nhỏ xuống 1 size là chuẩn.",
  ],
  TRUE_TO_SIZE: [
    "Form chuẩn đúng theo bảng size của shop, mình chọn theo chiều cao cân nặng mặc vừa in rất ưng ý.",
    "Đường may đẹp, chất vải xịn, kích cỡ chuẩn size (true to size) không cần tăng giảm.",
    "Mặc lên vừa vặn đúng chuẩn bảng quy đổi size, màu sắc bên ngoài giống hệt ảnh mẫu.",
  ],
};

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
  console.log("=== BẮT ĐẦU SEED BỔ SUNG ĐỦ 1.000 SẢN PHẨM (INCREMENTAL) ===");

  if (!fs.existsSync(HM_SEED_JSON_PATH)) {
    throw new Error(`Không tìm thấy file dữ liệu H&M: ${HM_SEED_JSON_PATH}`);
  }

  const hmProducts: HmProductInput[] = JSON.parse(
    fs.readFileSync(HM_SEED_JSON_PATH, "utf-8"),
  );
  console.log(`Đã đọc ${hmProducts.length} sản phẩm từ ${HM_SEED_JSON_PATH}.`);

  // 1. Bảo đảm Brands & Category Tree tồn tại (không xóa dữ liệu cũ)
  const brandByName = new Map<string, number>();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { name: b.name, slug: b.slug, logo: null },
    });
    brandByName.set(brand.name, brand.id);
  }

  const categoryByName = new Map<string, number>();
  for (const parent of CATEGORY_TREE) {
    const parentCat = await prisma.category.upsert({
      where: { name: parent.name },
      update: {},
      create: { name: parent.name },
    });
    categoryByName.set(parentCat.name, parentCat.id);

    for (const childName of parent.children) {
      const childCat = await prisma.category.upsert({
        where: { name: childName },
        update: { parentId: parentCat.id },
        create: { name: childName, parentId: parentCat.id },
      });
      categoryByName.set(childCat.name, childCat.id);
    }
  }
  const defaultBrandId =
    brandByName.get("H&M") ?? Array.from(brandByName.values())[0];

  // 2. Lấy danh sách slug đã tồn tại để chỉ insert sản phẩm mới
  const existingRows = await prisma.product.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existingRows.map((p) => p.slug));
  const itemsToInsert = hmProducts.filter(
    (item) => !existingSlugs.has(item.slug),
  );
  console.log(
    `Hiện có ${existingSlugs.size} sản phẩm trong DB. Cần thêm mới ${itemsToInsert.length} sản phẩm...`,
  );

  const newlyCreatedProducts: Array<{
    id: number;
    targetGender: GenderTarget;
    variants: Array<{ id: number; sellingPrice: unknown }>;
  }> = [];

  for (let i = 0; i < itemsToInsert.length; i++) {
    const item = itemsToInsert[i];
    const categoryId = categoryByName.get(item.categoryName);
    const brandId = brandByName.get(item.brandName) || defaultBrandId;

    if (!categoryId) {
      throw new Error(`Không tìm thấy danh mục: ${item.categoryName}`);
    }

    const created = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        targetGender: item.targetGender as GenderTarget,
        brandId,
        categoryId,
        material: item.material,
        careInstructions: item.careInstructions,
        season: item.season,
        provider: item.provider,
        images: {
          create: item.images,
        },
        variants: {
          create: item.variants,
        },
      },
      select: {
        id: true,
        targetGender: true,
        variants: {
          select: { id: true, sellingPrice: true },
          orderBy: { id: "asc" },
        },
      },
    });
    newlyCreatedProducts.push(created);

    if ((i + 1) % 50 === 0 || i + 1 === itemsToInsert.length) {
      console.log(
        `   -> Đã thêm ${i + 1}/${itemsToInsert.length} sản phẩm mới...`,
      );
    }
  }

  // 3. Gắn ~15% biến thể mới vào các Discount Group đang hoạt động
  if (newlyCreatedProducts.length > 0) {
    const discountGroups = await prisma.discountGroup.findMany({
      orderBy: { id: "asc" },
      take: 2,
    });
    if (discountGroups.length >= 2) {
      const discountRows: Array<{ groupId: number; variantId: number }> = [];
      for (let i = 0; i < newlyCreatedProducts.length; i++) {
        const p = newlyCreatedProducts[i];
        if (i % 10 === 0) {
          for (const v of p.variants.slice(0, 3)) {
            discountRows.push({ groupId: discountGroups[0].id, variantId: v.id });
          }
        } else if (i % 10 === 5) {
          for (const v of p.variants.slice(0, 2)) {
            discountRows.push({ groupId: discountGroups[1].id, variantId: v.id });
          }
        }
      }
      if (discountRows.length > 0) {
        await prisma.discountVariant.createMany({
          data: discountRows,
          skipDuplicates: true,
        });
        console.log(
          `Đã gắn ${discountRows.length} biến thể mới vào chương trình giảm giá.`,
        );
      }
    }

    // 4. Seed thêm fit reviews cho tối đa 120 sản phẩm mới (6 reviews/SP)
    const reviewTargets = newlyCreatedProducts.slice(0, 120);
    const existingUsers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { id: "asc" },
      take: 6,
    });
    while (existingUsers.length < 6) {
      const idx = existingUsers.length + 1;
      const u = await prisma.user.upsert({
        where: { email: `reviewer${idx}@fashionshop.com` },
        update: {},
        create: {
          email: `reviewer${idx}@fashionshop.com`,
          password: "$2b$10$SomeHashedPasswordHere.ThisIsAMock",
          firstName: "Khách",
          lastName: `Đánh Giá ${idx}`,
          role: "CUSTOMER",
        },
      });
      existingUsers.push(u);
    }

    const reviewerOrders = [];
    for (let rIdx = 0; rIdx < 6; rIdx++) {
      const u = existingUsers[rIdx];
      let ord = await prisma.order.findFirst({
        where: { userId: u.id, status: "COMPLETED" },
        orderBy: { id: "asc" },
      });
      if (!ord) {
        ord = await prisma.order.create({
          data: {
            userId: u.id,
            status: "COMPLETED",
            paymentMethod: "COD",
            paymentStatus: "PAID",
            subtotal: 500000,
            total: 500000,
          },
        });
      }
      reviewerOrders.push({ order: ord, user: u });
    }

    let createdReviews = 0;
    for (let pIdx = 0; pIdx < reviewTargets.length; pIdx++) {
      const prod = reviewTargets[pIdx];
      const firstVariant = prod.variants[0];
      if (!firstVariant) continue;

      const dominantFit: ProductFit =
        pIdx % 3 === 1 ? "TIGHT" : pIdx % 3 === 2 ? "LOOSE" : "TRUE_TO_SIZE";
      let ratingSum = 0;
      const reviewsCount = 6;

      for (let rIdx = 0; rIdx < reviewsCount; rIdx++) {
        const { order, user } = reviewerOrders[rIdx];
        const unitPrice = Number(firstVariant.sellingPrice);
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId: firstVariant.id,
            quantity: 1,
            originalUnitPrice: unitPrice,
            productDiscount: 0,
            finalUnitPrice: unitPrice,
            unitPrice,
          },
        });

        const fitValue: ProductFit = rIdx < 5 ? dominantFit : "TRUE_TO_SIZE";
        const rating = rIdx % 3 === 0 ? 4 : 5;
        ratingSum += rating;
        const isFemale = prod.targetGender === "FEMALE";
        const userHeight = isFemale
          ? 154 + ((rIdx * 3) % 15)
          : 165 + ((rIdx * 3) % 18);
        const userWeight = isFemale
          ? 45 + ((rIdx * 2) % 16)
          : 57 + ((rIdx * 3) % 24);
        const comments = FIT_COMMENTS[fitValue];

        await prisma.review.create({
          data: {
            productId: prod.id,
            userId: user.id,
            orderId: order.id,
            orderItemId: orderItem.id,
            rating,
            content: comments[rIdx % comments.length],
            fit: fitValue,
            userHeight,
            userWeight,
            status: "APPROVED",
          },
        });
        createdReviews++;
      }

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          reviewCount: reviewsCount,
          ratingAverage: Number((ratingSum / reviewsCount).toFixed(2)),
        },
      });
    }
    console.log(
      `Đã tạo ${createdReviews} đánh giá fit cho ${reviewTargets.length} sản phẩm mới.`,
    );
  }

  // 5. Chỉ sinh Vector Embedding 768 chiều cho các sản phẩm chưa có embedding
  const missingEmbeddingRows = await prisma.$queryRawUnsafe<
    Array<{ id: number }>
  >(`SELECT id FROM products WHERE embedding IS NULL ORDER BY id ASC`);
  const missingIds = missingEmbeddingRows.map((r) => r.id);

  console.log(
    `Đang sinh Vector Embedding (${OLLAMA_EMBEDDING_MODEL}) cho ${missingIds.length} sản phẩm chưa có embedding...`,
  );

  const productsToEmbed =
    missingIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: missingIds } },
          include: {
            category: { include: { parent: true } },
            brand: true,
            variants: true,
          },
          orderBy: { id: "asc" },
        })
      : [];

  const CONCURRENCY = 12;
  let embeddedSuccess = 0;
  let embeddedFail = 0;

  for (let i = 0; i < productsToEmbed.length; i += CONCURRENCY) {
    const batch = productsToEmbed.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (product) => {
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
          embeddedSuccess++;
        } catch (err: any) {
          embeddedFail++;
          console.error(
            `   [FAIL] #${product.id} - ${product.name}: ${err?.message || err}`,
          );
        }
      }),
    );

    if (
      (i + CONCURRENCY) % 60 === 0 ||
      i + CONCURRENCY >= productsToEmbed.length
    ) {
      console.log(
        `   -> Đã embed ${Math.min(i + CONCURRENCY, productsToEmbed.length)}/${productsToEmbed.length} (Thành công: ${embeddedSuccess}, Lỗi: ${embeddedFail})`,
      );
    }
  }

  const finalStats = await pool.query<{ total: number; embedded: number }>(
    "SELECT count(*)::int AS total, count(embedding)::int AS embedded FROM products",
  );
  console.log("\n=== HOÀN TẤT SEED ĐỦ 1.000 SẢN PHẨM & EMBEDDING ===");
  console.log(`- Tổng sản phẩm trong DB: ${finalStats.rows[0].total}`);
  console.log(`- Tổng sản phẩm đã embed: ${finalStats.rows[0].embedded}`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed 1.000 sản phẩm:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

