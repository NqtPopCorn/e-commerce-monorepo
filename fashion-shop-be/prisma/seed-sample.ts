import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { fakerVI as faker } from "@faker-js/faker";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  console.log("Seeding fashion sample data (mock)...");

  // 1. Create Mock Users
  const users = [];
  for (let i = 0; i < 9; i++) {
    const email = faker.internet.email();
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: "$2b$10$SomeHashedPasswordHere.ThisIsAMock",
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: "CUSTOMER",
      },
    });
    users.push(user);
  }
  console.log("Created 9 mock customer users");

  // 2. Create Brands
  const brandData = [
    { name: "Uniqlo", slug: "uniqlo", logo: "https://images.unsplash.com/photo-1544441893-675973e31985?w=100&q=80" },
    { name: "Zara", slug: "zara", logo: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&q=80" },
    { name: "H&M", slug: "hm", logo: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&q=80" },
    { name: "Nike", slug: "nike", logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80" },
    { name: "Adidas", slug: "adidas", logo: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=100&q=80" },
  ];
  const brands = [];
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    brands.push(brand);
  }
  console.log("Created brands");

  // 3. Create Categories (Tree)
  const categoryTree = [
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

  const subCategories: any[] = [];
  for (const parent of categoryTree) {
    const parentCat = await prisma.category.upsert({
      where: { name: parent.name },
      update: {},
      create: { name: parent.name },
    });

    for (const childName of parent.children) {
      const childCat = await prisma.category.upsert({
        where: { name: childName },
        update: { parentId: parentCat.id },
        create: { name: childName, parentId: parentCat.id },
      });
      subCategories.push(childCat);
    }
  }
  console.log("Created categories tree");

  // 4. Sample Fashion Product Templates
  const productTemplates = [
    { name: "Áo Thun Cotton Compact Cổ Tròn", cat: "Áo thun", mat: "100% Cotton Compact", care: "Giặt máy nhẹ, không dùng thuốc tẩy", season: "Xuân Hè" },
    { name: "Áo Polo Thể Thao Pique Co Giãn", cat: "Áo polo", mat: "95% Cotton, 5% Spandex", care: "Giặt nước lạnh, sấy nhiệt độ thấp", season: "Bốn mùa" },
    { name: "Áo Sơ Mi Oxford Dài Tay Regular", cat: "Áo sơ mi", mat: "Cotton Oxford cao cấp", care: "Ủi ở nhiệt độ trung bình", season: "Bốn mùa" },
    { name: "Áo Khoác Gió Chống Nước Thể Thao", cat: "Áo khoác", mat: "Polyester tráng PU", care: "Không vắt mạnh, phơi bóng râm", season: "Thu Đông" },
    { name: "Áo Khoác Blazer Hàn Quốc Casual", cat: "Áo khoác", mat: "Kaki tuyết mưa", care: "Nên giặt hấp", season: "Thu Đông" },
    { name: "Quần Jeans Slim Fit Co Giãn 4 Chiều", cat: "Quần jeans", mat: "Denim 12oz, 2% Elastane", care: "Giặt mặt trái, tránh ánh nắng gắt", season: "Bốn mùa" },
    { name: "Quần Kaki Ống Đứng Lịch Lãm", cat: "Quần kaki", mat: "Kaki co giãn nhẹ", care: "Giặt máy bình thường", season: "Bốn mùa" },
    { name: "Quần Short Thể Thao Thoáng Khí", cat: "Quần short", mat: "Polyester Quick-Dry", care: "Giặt nhanh, mau khô", season: "Mùa hè" },
    { name: "Quần Tây Âu Xếp Ly Thanh Lịch", cat: "Quần âu", mat: "Wool blend cao cấp", care: "Giặt khô hoặc giặt tay", season: "Bốn mùa" },
    { name: "Váy Suông Hoa Nhí Cổ Vuông Dáng Dài", cat: "Váy liền", mat: "Voan lụa mềm mại", care: "Giặt tay nhẹ nhàng", season: "Xuân Hè" },
    { name: "Đầm Xòe Công Sở Thắt Nơ Eo", cat: "Váy liền", mat: "Cotton lụa", care: "Ủi hơi nước", season: "Xuân Hè" },
    { name: "Chân Váy Chữ A Xếp Ly Tầng", cat: "Chân váy", mat: "Vải tuyết mưa", care: "Treo thẳng khi phơi", season: "Bốn mùa" },
    { name: "Mũ Lưỡi Trai Classic Canvas", cat: "Mũ nón", mat: "100% Canvas", care: "Giặt tay bằng bàn chải mềm", season: "Bốn mùa" },
    { name: "Thắt Lưng Da Bò Khóa Kim Loại", cat: "Thắt lưng", mat: "100% Da bò thật", care: "Bảo quản nơi khô ráo, tránh ẩm", season: "Bốn mùa" },
    { name: "Áo Thun Oversize Unisex In Họa Tiết", cat: "Áo thun", mat: "Cotton 2 chiều 250gsm", care: "Không ủi trực tiếp lên hình in", season: "Hè" },
    { name: "Áo Sơ Mi Linen Cổ Tàu Thoáng Mát", cat: "Áo sơ mi", mat: "100% Linen tự nhiên", care: "Giặt nước mát, không vắt xoắn", season: "Mùa hè" },
    { name: "Áo Khoác Bomber Lót Bông Giữ Ấm", cat: "Áo khoác", mat: "Nylon dù chống gió", care: "Giặt hấp hoặc giặt tay", season: "Mùa đông" },
    { name: "Quần Jeans Ống Rộng Phong Cách Retro", cat: "Quần jeans", mat: "Cotton Denim 100%", care: "Giặt riêng lần đầu", season: "Bốn mùa" },
    { name: "Quần Short Kaki Túi Hộp Chino", cat: "Quần short", mat: "Cotton Chino dày dặn", care: "Giặt máy bình thường", season: "Mùa hè" },
    { name: "Váy Len Dệt Kim Ôm Body Cổ Lọ", cat: "Váy liền", mat: "Len Acrylic dệt mềm", care: "Phơi nằm ngang tránh dão", season: "Mùa đông" },
    { name: "Áo Polo Phối Bo Cổ Cổ Điển", cat: "Áo polo", mat: "Cotton Spandex", care: "Giặt nhẹ với nước lạnh", season: "Bốn mùa" },
    { name: "Chân Váy Jean Midi Xẻ Tà Trước", cat: "Chân váy", mat: "Denim co giãn nhẹ", care: "Giặt mặt trái", season: "Bốn mùa" },
    { name: "Áo Thun Graphic Vintage Streetwear", cat: "Áo thun", mat: "100% Cotton 220gsm", care: "Lộn trái khi phơi", season: "Bốn mùa" },
    { name: "Áo Khoác Denim Rách Gấu Phủi Bụi", cat: "Áo khoác", mat: "Denim cotton wash mềm", care: "Giặt riêng đồ sáng màu", season: "Bốn mùa" },
    { name: "Quần Kaki Jogger Bo Gấu Thể Thao", cat: "Quần kaki", mat: "Kaki chun năng động", care: "Giặt máy nhiệt độ thường", season: "Bốn mùa" },
    { name: "Áo Sơ Mi Họa Tiết Hawaii Đi Biển", cat: "Áo sơ mi", mat: "Vải Rayon mát rượi", care: "Ủi nhẹ mặt trái", season: "Mùa hè" },
    { name: "Đầm Dạ Hội Ren Thêu Hoa Cao Cấp", cat: "Đầm dạ hội", mat: "Ren thêu thủ công", care: "Giặt khô chuyên dụng", season: "Bốn mùa" },
    { name: "Mũ Bucket Vành Tròn Vải Dù", cat: "Mũ nón", mat: "Polyester chống nước", care: "Lau sạch bằng khăn ẩm", season: "Bốn mùa" },
    { name: "Túi Tote Canvas Đựng Laptop", cat: "Túi xách", mat: "Canvas dày dặn 12oz", care: "Giặt tay nhẹ nhàng", season: "Bốn mùa" },
    { name: "Áo Hoodie Nỉ Bông Có Mũ Dày Dặn", cat: "Áo khoác", mat: "Nỉ bông Cotton 320gsm", care: "Giặt mặt trái, tránh sấy nóng", season: "Mùa đông" },
  ];

  const fashionImages = [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
  ];

  const colors = [
    { name: "Đen", hex: "#1A1A1A" },
    { name: "Trắng", hex: "#FFFFFF" },
    { name: "Xanh navy", hex: "#1B2A4A" },
    { name: "Xám tiêu", hex: "#8A8D8F" },
    { name: "Be sữa", hex: "#F3EDE2" },
  ];

  const sizes = ["S", "M", "L", "XL", "XXL"];

  const products = [];
  const variants: any[] = [];

  for (let i = 0; i < productTemplates.length; i++) {
    const tpl = productTemplates[i];
    const brand = faker.helpers.arrayElement(brands);
    const category = subCategories.find((c) => c.name === tpl.cat) || faker.helpers.arrayElement(subCategories);
    const slug = `${slugify(tpl.name)}-${faker.string.alphanumeric(5).toLowerCase()}`;

    // Variants: 2 to 4 combinations of size and color
    const pickedSizes = faker.helpers.arrayElements(sizes, { min: 2, max: 4 });
    const pickedColors = faker.helpers.arrayElements(colors, { min: 1, max: 2 });
    const variantData = [];

    const baseListPrice = faker.number.int({ min: 199, max: 899 }) * 1000;
    const baseDiscount = faker.helpers.arrayElement([0, 0.1, 0.15, 0.2, 0.3]);
    const baseSellingPrice = Math.round(baseListPrice * (1 - baseDiscount));

    for (const size of pickedSizes) {
      for (const col of pickedColors) {
        variantData.push({
          sku: `${slugify(tpl.name).substring(0, 6).toUpperCase()}-${size}-${col.name.substring(0, 2).toUpperCase()}-${faker.string.alphanumeric(3).toUpperCase()}`,
          barcode: faker.string.numeric(13),
          size: size,
          color: col.name,
          colorHex: col.hex,
          imageUrl: faker.helpers.arrayElement(fashionImages),
          listPrice: baseListPrice,
          sellingPrice: baseSellingPrice,
          stock: faker.number.int({ min: 15, max: 150 }),
          weight: faker.number.int({ min: 150, max: 600 }),
        });
      }
    }

    // Images for product
    const prodImages = faker.helpers.arrayElements(fashionImages, { min: 2, max: 4 }).map((url, idx) => ({
      url,
      altText: `${tpl.name} - Ảnh ${idx + 1}`,
      sortOrder: idx,
    }));

    const product = await prisma.product.create({
      data: {
        name: tpl.name,
        slug: slug,
        description: `${tpl.name} được thiết kế với chất liệu ${tpl.mat}, mang lại cảm giác thoải mái tối đa cho người mặc. Kiểu dáng hiện đại, thanh lịch, phù hợp cho mọi hoàn cảnh từ đi làm đến dạo phố.`,
        brandId: brand.id,
        categoryId: category.id,
        material: tpl.mat,
        careInstructions: tpl.care,
        season: tpl.season,
        provider: "Fashion Shop Official",
        variants: {
          create: variantData,
        },
        images: {
          create: prodImages,
        },
      },
      include: {
        variants: true,
        images: true,
      },
    });

    products.push(product);
    variants.push(...product.variants);

    // Create a batch for each variant
    for (const variant of product.variants) {
      await prisma.batch.create({
        data: {
          code: `BATCH-${faker.string.alphanumeric(6).toUpperCase()}`,
          quantity: variant.stock,
          variantId: variant.id,
        },
      });
    }
  }

  console.log(`Created ${products.length} fashion products with variants, images, and batches`);

  // 5. Create Promotions
  console.log("Creating promotions...");
  await prisma.promotionVariant.deleteMany();
  await prisma.promotionGroup.deleteMany();
  await prisma.promotionApplication.deleteMany();
  await prisma.promotion.deleteMany();

  const campaign = await prisma.promotion.create({
    data: {
      name: "Tuần lễ thời trang Hè - Ưu đãi bùng nổ",
      kind: "CAMPAIGN",
      priority: 10,
      startsAt: new Date("2026-01-01"),
      active: true,
      groups: {
        create: [
          {
            name: "Giảm 20% bộ sưu tập Áo Hot",
            sortOrder: 1,
            discountType: "PERCENT",
            discountValue: 20,
            variants: {
              create: variants.slice(0, 6).map((v) => ({ variantId: v.id })),
            },
          },
          {
            name: "Giảm 50k cho Quần & Váy chọn lọc",
            sortOrder: 2,
            discountType: "FIXED",
            discountValue: 50000,
            variants: {
              create: variants.slice(6, 12).map((v) => ({ variantId: v.id })),
            },
          },
        ],
      },
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Giảm 50k cho đơn từ 400k",
      kind: "ORDER_AUTO",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderAmount: 400000,
      priority: 5,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Giảm 10% cho đơn từ 800k",
      kind: "ORDER_AUTO",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderAmount: 800000,
      priority: 10,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Voucher khách hàng thân thiết - Giảm 50k",
      kind: "VOUCHER",
      code: "FASHION50K",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderAmount: 250000,
      maxUses: 100,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Voucher chào bạn mới - Giảm 15%",
      kind: "VOUCHER",
      code: "WELCOMEFASHION",
      discountType: "PERCENT",
      discountValue: 15,
      minOrderAmount: 300000,
      maxUses: 500,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });
  console.log("Created 1 campaign, 2 auto promotions, and 2 vouchers");

  // 6. Create Mock Orders
  const orders = [];
  for (let i = 0; i < 10; i++) {
    const user = faker.helpers.arrayElement(users);
    const var1 = faker.helpers.arrayElement(variants);
    let var2 = faker.helpers.arrayElement(variants);
    while (var1.id === var2.id) {
      var2 = faker.helpers.arrayElement(variants);
    }
    const status = faker.helpers.arrayElement([
      "PENDING",
      "CONFIRMED",
      "SHIPPING",
      "COMPLETED",
      "CANCELLED",
    ]);

    const item1Original = Number(var1.sellingPrice);
    const item2Original = Number(var2.sellingPrice);
    const subtotal = item1Original * 1 + item2Original * 2;
    const total = subtotal;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: status as any,
        subtotal: subtotal,
        productDiscount: 0,
        orderDiscount: 0,
        voucherDiscount: 0,
        total: total,
        items: {
          create: [
            {
              variantId: var1.id,
              quantity: 1,
              originalUnitPrice: item1Original,
              productDiscount: 0,
              finalUnitPrice: item1Original,
              unitPrice: item1Original,
            },
            {
              variantId: var2.id,
              quantity: 2,
              originalUnitPrice: item2Original,
              productDiscount: 0,
              finalUnitPrice: item2Original,
              unitPrice: item2Original,
            },
          ],
        },
      },
    });
    orders.push(order);
  }
  console.log("Created 10 mock orders");
  console.log("Sample seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
