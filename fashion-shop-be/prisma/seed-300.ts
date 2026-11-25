import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient, GenderTarget, ProductFit } from "@prisma/client";
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

const HM_SEED_JSON_PATH = path.resolve(
  "H:/Code/PET/customer-shop-assistant/data/hm_seed_300.json",
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
  console.log("=== BẮT ĐẦU SEED 300 SẢN PHẨM THỰC TẾ (ARCHIVE + PARQUET) ===");

  if (!fs.existsSync(HM_SEED_JSON_PATH)) {
    throw new Error(`Không tìm thấy file dữ liệu H&M: ${HM_SEED_JSON_PATH}`);
  }

  const hmProducts: HmProductInput[] = JSON.parse(
    fs.readFileSync(HM_SEED_JSON_PATH, "utf-8"),
  );
  console.log(`Đã đọc ${hmProducts.length} sản phẩm đã Việt hóa từ JSON.`);

  // 1. Dọn dẹp toàn bộ dữ liệu sản phẩm và các bảng phụ thuộc cũ (bao gồm 30 sample cũ)
  console.log("1. Đang dọn dẹp toàn bộ sản phẩm cũ và các bảng phụ thuộc...");
  await prisma.reviewLike.deleteMany();
  await prisma.review.deleteMany();
  await prisma.discountApplication.deleteMany();
  await prisma.voucherApplication.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.discountVariant.deleteMany();
  await prisma.purchaseReceiptItem.deleteMany();
  await prisma.purchaseReceipt.deleteMany();
  await prisma.product.deleteMany();

  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE products_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE product_images_id_seq RESTART WITH 1`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE product_variants_id_seq RESTART WITH 1`,
  );

  // 2. Khởi tạo Brands & Category Tree độc lập (không phụ thuộc seed-sample.ts)
  console.log("2. Đang khởi tạo Brands & Category Tree...");
  const brandByName = new Map<string, number>();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, logo: null },
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
  const defaultBrandId = brandByName.get("H&M") ?? Array.from(brandByName.values())[0];

  // 3. Insert toàn bộ 300 sản phẩm sạch từ JSON
  console.log(`3. Đang thêm ${hmProducts.length} sản phẩm từ JSON...`);
  let insertedHmCount = 0;

  for (const item of hmProducts) {
    const categoryId = categoryByName.get(item.categoryName);
    const brandId = brandByName.get(item.brandName) || defaultBrandId;

    if (!categoryId) {
      throw new Error(`Không tìm thấy danh mục: ${item.categoryName}`);
    }

    await prisma.product.create({
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
    });
    insertedHmCount++;
    if (insertedHmCount % 50 === 0 || insertedHmCount === hmProducts.length) {
      console.log(`   -> Đã thêm ${insertedHmCount}/${hmProducts.length} sản phẩm...`);
    }
  }

  const allProducts = await prisma.product.findMany({
    include: {
      variants: true,
      category: { include: { parent: true } },
      brand: true,
    },
    orderBy: { id: "asc" },
  });
  console.log(`Tổng số sản phẩm hiện có trong DB: ${allProducts.length}`);

  // 4. Khởi tạo Campaign, Discounts & Vouchers (bao gồm SUMMER50, SUMMER2026, FASHION50K)
  console.log("3. Đang cấu hình Khuyến mãi (Discounts) và Vouchers...");
  await prisma.voucher.deleteMany();
  await prisma.discountGroup.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.campaign.deleteMany();

  const summerCampaign = await prisma.campaign.create({
    data: {
      name: "Chiến dịch Thời Trang 2026",
      description: "Ưu đãi lớn toàn hệ thống thời trang 2026",
      budgetLimit: 100000000,
      spentAmount: 0,
      startsAt: new Date("2026-01-01"),
    },
  });

  // Chọn các biến thể của 30 sản phẩm đầu + ~15% biến thể mới để đưa vào chương trình giảm giá
  const discountVariantIds1: number[] = [];
  const discountVariantIds2: number[] = [];

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    if (i < 5 || i % 10 === 0) {
      for (const v of p.variants.slice(0, 3)) {
        discountVariantIds1.push(v.id);
      }
    } else if (i < 12 || i % 10 === 5) {
      for (const v of p.variants.slice(0, 2)) {
        discountVariantIds2.push(v.id);
      }
    }
  }

  await prisma.discount.create({
    data: {
      campaignId: summerCampaign.id,
      name: "Flash Sale 20% BST Áo & Đầm Chọn Lọc",
      description: "Giảm trực tiếp 20% tối đa 100.000đ cho các sản phẩm chủ lực",
      priority: 10,
      budgetLimit: 30000000,
      startsAt: new Date("2026-01-01"),
      active: true,
      groups: {
        create: [
          {
            name: "Giảm 20% tối đa 100k",
            sortOrder: 1,
            discountType: "PERCENT",
            discountValue: 20,
            maxDiscountValue: 100000,
            variants: {
              create: discountVariantIds1.map((vid) => ({ variantId: vid })),
            },
          },
        ],
      },
    },
  });

  await prisma.discount.create({
    data: {
      campaignId: summerCampaign.id,
      name: "Ưu Đãi Giảm 50.000đ Quần & Váy Công Sở",
      description: "Giảm ngay 50.000đ cho các mẫu quần jeans, kaki, quần âu và váy",
      priority: 5,
      budgetLimit: 20000000,
      startsAt: new Date("2026-01-01"),
      active: true,
      groups: {
        create: [
          {
            name: "Giảm trực tiếp 50k",
            sortOrder: 1,
            discountType: "FIXED",
            discountValue: 50000,
            maxDiscountValue: 50000,
            variants: {
              create: discountVariantIds2.map((vid) => ({ variantId: vid })),
            },
          },
        ],
      },
    },
  });

  await prisma.voucher.createMany({
    data: [
      {
        campaignId: summerCampaign.id,
        code: "SUMMER50",
        name: "Voucher Hè SUMMER50 - Giảm 15% tối đa 50k đơn từ 300k",
        description: "Giảm 15% (tối đa 50.000đ) áp dụng cho đơn hàng từ 300.000đ",
        discountType: "PERCENT",
        discountValue: 15,
        maxDiscountValue: 50000,
        minOrderAmount: 300000,
        maxUses: 500,
        maxUsesPerCustomer: 2,
        budgetLimit: 25000000,
        startsAt: new Date("2026-01-01"),
        active: true,
      },
      {
        campaignId: summerCampaign.id,
        code: "SUMMER2026",
        name: "Voucher Hè 2026 - Giảm 10% đơn từ 300k",
        description: "Giảm 10% tối đa 80.000đ cho đơn từ 300.000đ",
        discountType: "PERCENT",
        discountValue: 10,
        maxDiscountValue: 80000,
        minOrderAmount: 300000,
        maxUses: 200,
        maxUsesPerCustomer: 1,
        budgetLimit: 10000000,
        startsAt: new Date("2026-01-01"),
        active: true,
      },
      {
        campaignId: summerCampaign.id,
        code: "FASHION50K",
        name: "Voucher Thành Viên Mới - Giảm 50k đơn từ 250k",
        description: "Giảm ngay 50.000đ cho đơn hàng đạt tối thiểu 250.000đ",
        discountType: "FIXED",
        discountValue: 50000,
        minOrderAmount: 250000,
        maxUses: 200,
        maxUsesPerCustomer: 1,
        budgetLimit: 10000000,
        startsAt: new Date("2026-01-01"),
        active: true,
      },
    ],
  });

  // 5. Tạo Reviews có thông số fit (TIGHT / TRUE_TO_SIZE / LOOSE) cho 100 sản phẩm chủ lực (12 reviews/SP = 1.200 reviews)
  console.log("4. Đang khởi tạo 1.200 Reviews (100 sản phẩm x 12 reviews) kèm tín hiệu fit...");
  // Đảm bảo có đủ 15 customer users để tạo 15 đơn hàng COMPLETED
  const existingUsers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { id: "asc" },
  });
  while (existingUsers.length < 15) {
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

  // Tạo 12 đơn hàng COMPLETED tương ứng với 12 reviewers
  const reviewerOrders = [];
  for (let rIdx = 0; rIdx < 12; rIdx++) {
    const u = existingUsers[rIdx];
    const ord = await prisma.order.create({
      data: {
        userId: u.id,
        status: "COMPLETED",
        paymentMethod: "COD",
        paymentStatus: "PAID",
        subtotal: 500000,
        total: 500000,
      },
    });
    reviewerOrders.push({ order: ord, user: u });
  }

  // Reset reviewCount & ratingAverage cho toàn bộ sản phẩm trước khi gán mới
  await prisma.product.updateMany({
    data: { reviewCount: 0, ratingAverage: 0 },
  });

  // Chọn đúng 100 sản phẩm rải đều các danh mục, đảm bảo có 2 sản phẩm anchor fit cho Golden Eval
  const poloPiqueAnchor = allProducts.find(
    (p) => p.category?.name === "Áo polo" && p.name.includes("Pique"),
  );
  const oversizeTeeAnchor = allProducts.find(
    (p) => p.category?.name === "Áo thun" && p.name.includes("Oversize"),
  );

  const reviewedMap = new Map<number, (typeof allProducts)[number]>();
  if (poloPiqueAnchor) reviewedMap.set(poloPiqueAnchor.id, poloPiqueAnchor);
  if (oversizeTeeAnchor) reviewedMap.set(oversizeTeeAnchor.id, oversizeTeeAnchor);

  for (let idx = 0; idx < allProducts.length && reviewedMap.size < 100; idx += 3) {
    reviewedMap.set(allProducts[idx].id, allProducts[idx]);
  }
  for (let idx = 0; idx < allProducts.length && reviewedMap.size < 100; idx++) {
    reviewedMap.set(allProducts[idx].id, allProducts[idx]);
  }
  const reviewedProducts = Array.from(reviewedMap.values());

  let totalReviewsCreated = 0;

  for (let pIdx = 0; pIdx < reviewedProducts.length; pIdx++) {
    const prod = reviewedProducts[pIdx];
    const firstVariant = prod.variants[0];
    if (!firstVariant) continue;

    // Xác định xu hướng fit chủ đạo cho sản phẩm:
    // - Áo Polo Pique anchor -> TIGHT (SIZE_REV_01)
    // - Áo Thun Oversize anchor -> LOOSE (SIZE_REV_02)
    // - Các sản phẩm còn lại chia đều 3 nhóm: TRUE_TO_SIZE, TIGHT, LOOSE
    let dominantFit: ProductFit = "TRUE_TO_SIZE";
    if (poloPiqueAnchor && prod.id === poloPiqueAnchor.id) {
      dominantFit = "TIGHT";
    } else if (oversizeTeeAnchor && prod.id === oversizeTeeAnchor.id) {
      dominantFit = "LOOSE";
    } else if (pIdx % 3 === 1) {
      dominantFit = "TIGHT";
    } else if (pIdx % 3 === 2) {
      dominantFit = "LOOSE";
    }

    let ratingSum = 0;
    const reviewsCount = 12;

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

      // 10/12 reviews mang dominantFit, 2/12 mang TRUE_TO_SIZE (hoặc xen kẽ) để phân phối thực tế
      const fitValue: ProductFit =
        rIdx < 10
          ? dominantFit
          : dominantFit === "TRUE_TO_SIZE"
            ? rIdx === 10
              ? "TIGHT"
              : "LOOSE"
            : "TRUE_TO_SIZE";

      const rating = rIdx % 4 === 0 ? 4 : 5;
      ratingSum += rating;

      const isFemale = prod.targetGender === "FEMALE";
      const userHeight = isFemale
        ? 153 + ((rIdx * 3) % 16)
        : 164 + ((rIdx * 3) % 19);
      const userWeight = isFemale
        ? 44 + ((rIdx * 2) % 18)
        : 56 + ((rIdx * 3) % 26);

      const comments = FIT_COMMENTS[fitValue];
      const commentText = comments[rIdx % comments.length];

      await prisma.review.create({
        data: {
          productId: prod.id,
          userId: user.id,
          orderId: order.id,
          orderItemId: orderItem.id,
          rating,
          content: commentText,
          fit: fitValue,
          userHeight,
          userWeight,
          status: "APPROVED",
        },
      });
      totalReviewsCreated++;
    }

    const avgRating = Number((ratingSum / reviewsCount).toFixed(2));
    await prisma.product.update({
      where: { id: prod.id },
      data: {
        reviewCount: reviewsCount,
        ratingAverage: avgRating,
      },
    });
  }
  console.log(`   -> Đã tạo ${totalReviewsCreated} đánh giá cho ${reviewedProducts.length} sản phẩm.`);

  // 6. Sinh Vector Embedding 1024 chiều qua Ollama (bge-m3) với Batch Concurrency = 12
  console.log(
    `5. Đang sinh Vector Embedding 1024 chiều (${OLLAMA_EMBEDDING_MODEL}) cho toàn bộ ${allProducts.length} sản phẩm...`,
  );

  // Tải lại danh sách sản phẩm đầy đủ kèm variants vừa cập nhật
  const productsToEmbed = await prisma.product.findMany({
    include: {
      category: { include: { parent: true } },
      brand: true,
      variants: true,
    },
    orderBy: { id: "asc" },
  });

  const CONCURRENCY = 12;
  let embeddedSuccess = 0;
  let embeddedFail = 0;

  for (let i = 0; i < productsToEmbed.length; i += CONCURRENCY) {
    const batch = productsToEmbed.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (product) => {
        const text = buildProductEmbeddingText(product);
        const searchText = buildProductSearchText(product);
        try {
          const vector = await fetchEmbedding(text);
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
            text,
            OLLAMA_EMBEDDING_MODEL,
            searchText,
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
        `   -> Đã embed ${Math.min(i + CONCURRENCY, productsToEmbed.length)}/${productsToEmbed.length} sản phẩm (Thành công: ${embeddedSuccess}, Lỗi: ${embeddedFail})`,
      );
    }
  }

  console.log("\n=== HOÀN TẤT SEED 300 SẢN PHẨM & EMBEDDING ===");
  console.log(`- Tổng sản phẩm: ${productsToEmbed.length}`);
  console.log(`- Tổng reviews: ${totalReviewsCreated}`);
  console.log(`- Embedding thành công: ${embeddedSuccess}/${productsToEmbed.length}`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed 300 sản phẩm:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
