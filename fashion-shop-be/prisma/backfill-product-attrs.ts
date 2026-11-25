import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PATTERN_RULES: Array<[RegExp, string]> = [
  [/Họa Tiết Toàn Thân|All over pattern/i, "Họa Tiết Toàn Thân"],
  [/In Họa Tiết Điểm Nhấn|Placement print/i, "In Họa Tiết Điểm Nhấn"],
  [/In Hình Trước Ngực|Front print|In hình/i, "In Hình Trước Ngực"],
  [/Phối Màu Colorblock|Colour blocking|Phối màu/i, "Phối Màu Colorblock"],
  [/Dệt Hoa Văn Jacquard|Jacquard/i, "Dệt Hoa Văn Jacquard"],
  [/Ánh Nhũ Sang Trọng|Glittering|Metallic|Sequin|kim sa/i, "Ánh Nhũ Sang Trọng"],
  [/Xước Melange|Melange/i, "Xước Melange"],
  [/Kẻ Caro|Caro|\bCheck\b/i, "Kẻ Caro"],
  [/Kẻ Sọc|Sọc|Stripe/i, "Kẻ Sọc"],
  [/Chấm bi|\bDot\b/i, "Chấm Bi"],
  [/Hoa nhí|Họa tiết hoa|Floral/i, "Họa Tiết Hoa"],
  [/Denim Wash|\bDenim\b/i, "Denim Wash"],
  [/Phối Ren|\bRen\b|\bLace\b/i, "Phối Ren"],
  [/Thêu Tinh Tế|Thêu|Embroidery/i, "Thêu Tinh Tế"],
  [/Dệt Gân Tăm|Gân tăm|\bRib\b/i, "Dệt Gân Tăm"],
  [/Phối Lưới|\bMesh\b/i, "Phối Lưới Thoáng Khí"],
  [/Trơn Basic|\bTrơn\b|\bSolid\b/i, "Trơn Basic"],
];

const FIT_RULES: Array<[RegExp, string]> = [
  [/Regular Fit/i, "Regular Fit"],
  [/Slim Fit/i, "Slim Fit"],
  [/Oversize(?:d)?/i, "Oversize"],
  [/Relaxed Fit/i, "Relaxed Fit"],
  [/Loose Fit/i, "Loose Fit"],
  [/Skinny Fit|\bSkinny\b/i, "Skinny Fit"],
  [/Straight Fit|Ống suông|Straight/i, "Straight Fit"],
  [/Wide Leg|Ống rộng/i, "Wide Leg"],
  [/Tailored/i, "Tailored Fit"],
  [/Bodycon|Ôm sát/i, "Bodycon / Ôm sát"],
  [/Chữ A|A-Line|Dáng chữ A/i, "Dáng chữ A"],
  [/Xếp ly|Pleated/i, "Dáng xếp ly"],
  [/Form suông|Dáng suông/i, "Form suông"],
  [/Form rộng|Dáng rộng/i, "Form rộng"],
  [/Form ôm|Dáng ôm/i, "Form ôm"],
];

function extractPattern(text: string): string | null {
  for (const [regex, label] of PATTERN_RULES) {
    if (regex.test(text)) {
      return label;
    }
  }
  return null;
}

function extractFit(text: string): string | null {
  for (const [regex, label] of FIT_RULES) {
    if (regex.test(text)) {
      return label;
    }
  }
  return null;
}

function extractOccasion(
  description: string | null,
  categoryName: string | null,
  fullText: string,
): string | null {
  if (description) {
    const match = description.match(/Thiết kế phù hợp để\s+([^.]+)\./i);
    if (match && match[1]) {
      const cleaned = match[1].trim();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  const tags: string[] = [];
  if (/công sở|đi làm|văn phòng|lịch sự|office|smart casual/i.test(fullText)) {
    tags.push("Công sở, Đi làm");
  }
  if (/dự tiệc|dạ hội|tiệc|party|event|sang trọng/i.test(fullText)) {
    tags.push("Dự tiệc, Sự kiện");
  }
  if (/thể thao|tập gym|chạy bộ|năng động|vận động|sport/i.test(fullText)) {
    tags.push("Thể thao, Vận động");
  }
  if (/dạo phố|hàng ngày|đi chơi|casual|cuối tuần/i.test(fullText)) {
    tags.push("Dạo phố, Hàng ngày");
  }

  if (tags.length > 0) {
    return tags.join(", ");
  }

  if (categoryName) {
    if (/Đầm dạ hội/i.test(categoryName)) return "Dự tiệc, Sự kiện";
    if (/Quần âu|Áo sơ mi/i.test(categoryName)) return "Công sở, Đi làm";
    return "Dạo phố, Hàng ngày";
  }

  return null;
}

async function main() {
  console.log("=== BACKFILL ATTRIBUTES (pattern, fit, occasion) ===");

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: "asc" },
  });

  let updated = 0;
  for (const p of products) {
    const fullText = `${p.name} ${p.description || ""}`;
    const pattern = p.pattern ?? extractPattern(fullText);
    const fit = p.fit ?? extractFit(fullText);
    const occasion =
      p.occasion ??
      extractOccasion(p.description, p.category?.name ?? null, fullText);

    if (
      pattern !== p.pattern ||
      fit !== p.fit ||
      occasion !== p.occasion
    ) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          pattern,
          fit,
          occasion,
        },
      });
      updated++;
    }
  }

  const stats = await pool.query<{
    total: number;
    has_pattern: number;
    has_fit: number;
    has_occasion: number;
  }>(
    `SELECT count(*)::int AS total,
            count(pattern)::int AS has_pattern,
            count(fit)::int AS has_fit,
            count(occasion)::int AS has_occasion
     FROM products`,
  );

  console.log(`Đã cập nhật ${updated}/${products.length} sản phẩm.`);
  console.table(stats.rows);
}

main()
  .catch((e) => {
    console.error("Lỗi backfill attributes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

