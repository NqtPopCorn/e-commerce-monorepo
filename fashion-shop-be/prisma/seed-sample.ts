import { PrismaClient, Prisma } from "@prisma/client";
import { fakerVI as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample data (mock)...");

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

  // 2. Create Categories
  const categories = [];
  const categoryNames = [
    "Văn học",
    "Kinh tế",
    "Tâm lý - Kỹ năng sống",
    "Thiếu nhi",
    "Giáo khoa",
    "Ngoại ngữ",
  ];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.push(category);
  }
  console.log("Created categories");

  // 4. Create Books
  const books = [];
  let variants = []; // Keep track of all variants for order seeding
  for (let i = 0; i < 30; i++) {
    const formatCount = faker.helpers.arrayElement([1, 2]); // Some books have 1 format, some have 2
    const formats = ["Bìa mềm", "Bìa cứng"];

    const bookVariantsData = [];
    for (let j = 0; j < formatCount; j++) {
      bookVariantsData.push({
        sku: faker.string.alphanumeric(8).toUpperCase(),
        isbn: faker.string.uuid(),
        format: formats[j],
        listPrice: faker.number.int({ min: 50, max: 300 }) * 1000,
        sellingPrice: faker.number.int({ min: 30, max: 250 }) * 1000,
        stock: faker.number.int({ min: 10, max: 200 }),
        weight: faker.number.int({ min: 100, max: 1000 }),
        dimensions: faker.helpers.arrayElement([
          "14 x 20 cm",
          "16 x 24 cm",
          "13 x 19 cm",
        ]),
        pages: faker.number.int({ min: 100, max: 500 }),
        imageUrl: `https://picsum.photos/seed/${faker.string.alphanumeric(4)}/300/400`,
      });
    }

    const book = await prisma.book.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 7 }),
        description: faker.lorem.paragraphs(2),
        categoryId: faker.helpers.arrayElement(categories).id,
        authors: [faker.person.fullName()],
        publisher: faker.helpers.arrayElement([
          "NXB Trẻ",
          "NXB Kim Đồng",
          "Nhã Nam",
          "Alphabooks",
          "NXB Tổng hợp",
        ]),
        translators: faker.helpers.arrayElement([
          null,
          [faker.person.fullName()],
        ]) as Prisma.InputJsonValue,
        provider: faker.helpers.arrayElement([
          "FAHASA",
          "Tiki Trading",
          "NXB Trẻ",
        ]),
        publishYear: faker.number.int({ min: 2010, max: 2024 }),
        language: faker.helpers.arrayElement(["Tiếng Việt", "Tiếng Anh"]),
        variants: {
          create: bookVariantsData,
        },
      },
      include: {
        variants: true,
      },
    });
    books.push(book);
    variants.push(...book.variants);

    // Create a batch for each variant
    for (const variant of book.variants) {
      await prisma.batch.create({
        data: {
          code: `BATCH-${faker.string.alphanumeric(6).toUpperCase()}`,
          quantity: variant.stock,
          variantId: variant.id,
        },
      });
    }
  }
  console.log("Created 30 books with batches");

  // 5. Create Promotions
  console.log("Creating promotions...");
  await prisma.promotionGroup.deleteMany();
  await prisma.promotionApplication.deleteMany();
  await prisma.promotion.deleteMany();

  const campaign = await prisma.promotion.create({
    data: {
      name: "Chiến dịch hè rực rỡ",
      kind: "CAMPAIGN",
      priority: 10,
      startsAt: new Date("2026-01-01"),
      active: true,
      groups: {
        create: [
          {
            name: "Giảm 15% sách hot",
            sortOrder: 1,
            discountType: "PERCENT",
            discountValue: 15,
            variants: {
              create: variants.slice(0, 5).map((v) => ({ variantId: v.id })),
            },
          },
          {
            name: "Giảm 20k sách chọn lọc",
            sortOrder: 2,
            discountType: "FIXED",
            discountValue: 20000,
            variants: {
              create: variants.slice(5, 10).map((v) => ({ variantId: v.id })),
            },
          },
        ],
      },
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Giảm 50k cho đơn từ 300k",
      kind: "ORDER_AUTO",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderAmount: 300000,
      priority: 5,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Giảm 10% cho đơn từ 500k",
      kind: "ORDER_AUTO",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderAmount: 500000,
      priority: 10,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Voucher tri ân khách hàng - Giảm 30k",
      kind: "VOUCHER",
      code: "TRIAN30K",
      discountType: "FIXED",
      discountValue: 30000,
      minOrderAmount: 100000,
      maxUses: 100,
      startsAt: new Date("2026-01-01"),
      active: true,
    },
  });

  await prisma.promotion.create({
    data: {
      name: "Voucher bạn mới - Giảm 20%",
      kind: "VOUCHER",
      code: "WELCOME20",
      discountType: "PERCENT",
      discountValue: 20,
      minOrderAmount: 200000,
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
  });
