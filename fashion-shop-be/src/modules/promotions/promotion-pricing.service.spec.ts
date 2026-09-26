import assert from "node:assert/strict";
import { DiscountType, PromotionKind } from "@prisma/client";
import { PromotionPricingService } from "./promotion-pricing.service";

async function runTests() {
  console.log("Running PromotionPricingService unit tests...");

  const mockPrisma: any = {
    bookVariant: {
      findMany: async () => [],
    },
    promotion: {
      findMany: async () => [],
      findUnique: async () => null,
    },
  };

  const service = new PromotionPricingService(mockPrisma);

  // 1. calculateDiscount
  assert.equal(service.calculateDiscount(100000, DiscountType.PERCENT, 10), 10000);
  assert.equal(service.calculateDiscount(50000, DiscountType.FIXED, 80000), 50000);
  assert.equal(service.calculateDiscount(100000, DiscountType.PERCENT, 15), 15000);
  console.log("✔ calculateDiscount tests passed");

  // 2. Highest priority campaign winner
  mockPrisma.bookVariant.findMany = async () => [{ id: 1, sellingPrice: 100000 }];
  mockPrisma.promotion.findMany = async () => [
    {
      id: 10,
      name: "Low Priority Campaign",
      kind: PromotionKind.CAMPAIGN,
      priority: 5,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [
        {
          id: 101,
          discountType: DiscountType.PERCENT,
          discountValue: 20,
          variants: [{ variantId: 1 }],
        },
      ],
    },
    {
      id: 20,
      name: "High Priority Campaign",
      kind: PromotionKind.CAMPAIGN,
      priority: 10,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [
        {
          id: 201,
          discountType: DiscountType.PERCENT,
          discountValue: 10,
          variants: [{ variantId: 1 }],
        },
      ],
    },
  ];

  let res = await service.quote([{ variantId: 1, quantity: 1 }]);
  assert.equal(res.subtotal, 100000);
  assert.equal(res.productDiscount, 10000);
  assert.equal(res.lines[0].campaign?.id, 20);
  console.log("✔ Priority resolution passed");

  // 3. Priority tie breaker (larger monetary discount then smaller ID)
  mockPrisma.promotion.findMany = async () => [
    {
      id: 30,
      name: "Campaign 30",
      kind: PromotionKind.CAMPAIGN,
      priority: 10,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [
        {
          id: 301,
          discountType: DiscountType.FIXED,
          discountValue: 10000,
          variants: [{ variantId: 1 }],
        },
      ],
    },
    {
      id: 10,
      name: "Campaign 10",
      kind: PromotionKind.CAMPAIGN,
      priority: 10,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [
        {
          id: 101,
          discountType: DiscountType.FIXED,
          discountValue: 10000,
          variants: [{ variantId: 1 }],
        },
      ],
    },
  ];
  res = await service.quote([{ variantId: 1, quantity: 1 }]);
  assert.equal(res.lines[0].campaign?.id, 10);
  console.log("✔ Tie-breaker (smaller ID) passed");

  // 4. Auto invoice winner (highest monetary discount)
  mockPrisma.bookVariant.findMany = async () => [{ id: 1, sellingPrice: 500000 }];
  mockPrisma.promotion.findMany = async () => [
    {
      id: 1,
      name: "Auto Promo 50k",
      kind: PromotionKind.ORDER_AUTO,
      discountType: DiscountType.FIXED,
      discountValue: 50000,
      minOrderAmount: 300000,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [],
    },
    {
      id: 2,
      name: "Auto Promo 20%",
      kind: PromotionKind.ORDER_AUTO,
      discountType: DiscountType.PERCENT,
      discountValue: 20,
      minOrderAmount: 400000,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [],
    },
  ];
  res = await service.quote([{ variantId: 1, quantity: 1 }]);
  assert.equal(res.subtotal, 500000);
  assert.equal(res.orderDiscount, 100000);
  console.log("✔ Auto invoice winner resolution passed");

  // 5. Voucher calculated after auto invoice
  mockPrisma.promotion.findMany = async () => [
    {
      id: 1,
      name: "Auto Promo 100k",
      kind: PromotionKind.ORDER_AUTO,
      discountType: DiscountType.FIXED,
      discountValue: 100000,
      minOrderAmount: 300000,
      active: true,
      startsAt: new Date("2026-01-01"),
      groups: [],
    },
  ];
  mockPrisma.promotion.findUnique = async () => ({
    id: 99,
    name: "Voucher 10%",
    kind: PromotionKind.VOUCHER,
    code: "VOUCHER10",
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    minOrderAmount: 300000,
    active: true,
    startsAt: new Date("2026-01-01"),
    usedCount: 0,
    maxUses: 10,
  });

  res = await service.quote([{ variantId: 1, quantity: 1 }], "VOUCHER10");
  assert.equal(res.subtotal, 500000);
  assert.equal(res.orderDiscount, 100000);
  assert.equal(res.voucherDiscount, 40000);
  assert.equal(res.total, 360000);
  console.log("✔ Voucher after auto invoice passed");

  // 6. Max uses exceeded voucher error
  mockPrisma.promotion.findMany = async () => [];
  mockPrisma.promotion.findUnique = async () => ({
    id: 99,
    name: "Exhausted Voucher",
    kind: PromotionKind.VOUCHER,
    code: "EXHAUSTED",
    discountType: DiscountType.FIXED,
    discountValue: 50000,
    active: true,
    startsAt: new Date("2026-01-01"),
    usedCount: 10,
    maxUses: 10,
  });

  res = await service.quote([{ variantId: 1, quantity: 1 }], "EXHAUSTED");
  assert.equal(res.voucherError, "Mã voucher đã hết lượt sử dụng");
  assert.equal(res.voucherDiscount, 0);
  console.log("✔ Exhausted voucher check passed");

  console.log("All PromotionPricingService unit tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
