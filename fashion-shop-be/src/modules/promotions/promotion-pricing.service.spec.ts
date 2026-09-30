import { Test, TestingModule } from "@nestjs/testing";
import { PromotionPricingService } from "./promotion-pricing.service";
import { PrismaService } from "../../prisma/prisma.service";
import { DiscountType, PromotionKind } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("PromotionPricingService", () => {
  let service: PromotionPricingService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionPricingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PromotionPricingService>(PromotionPricingService);
  });

  describe("calculateDiscount", () => {
    it("should calculate PERCENT discount correctly", () => {
      expect(service.calculateDiscount(100000, DiscountType.PERCENT, 10)).toBe(
        10000,
      );
    });

    it("should calculate FIXED discount up to max price", () => {
      expect(service.calculateDiscount(50000, DiscountType.FIXED, 80000)).toBe(
        50000,
      );
    });

    it("should calculate PERCENT discount with another value", () => {
      expect(service.calculateDiscount(100000, DiscountType.PERCENT, 15)).toBe(
        15000,
      );
    });
  });

  describe("quote (Priority Resolution)", () => {
    it("should resolve highest priority campaign winner", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 100000 } as any,
      ]);

      prismaMock.promotion.findMany.mockResolvedValue([
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
        } as any,
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
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);
      expect(res.subtotal).toBe(100000);
      expect(res.productDiscount).toBe(10000);
      expect(res.lines[0].campaign?.id).toBe(20);
    });

    it("should resolve priority tie breaker (smaller ID wins if discount is same)", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 100000 } as any,
      ]);
      prismaMock.promotion.findMany.mockResolvedValue([
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
        } as any,
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
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);
      expect(res.lines[0].campaign?.id).toBe(10);
    });
  });

  describe("quote (Order Auto Invoice)", () => {
    it("should apply auto invoice winner with highest monetary discount", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 500000 } as any,
      ]);

      prismaMock.promotion.findMany.mockResolvedValue([
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
        } as any,
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
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);
      expect(res.subtotal).toBe(500000);
      expect(res.orderDiscount).toBe(100000);
    });
  });

  describe("quote (Voucher)", () => {
    it("should calculate voucher after auto invoice", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 500000 } as any,
      ]);

      prismaMock.promotion.findMany.mockResolvedValue([
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
        } as any,
      ]);

      prismaMock.promotion.findUnique.mockResolvedValue({
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
      } as any);

      const res = await service.quote(
        [{ variantId: 1, quantity: 1 }],
        "VOUCHER10",
      );
      expect(res.subtotal).toBe(500000);
      expect(res.orderDiscount).toBe(100000);
      expect(res.voucherDiscount).toBe(40000);
      expect(res.total).toBe(360000);
    });

    it("should handle max uses exceeded voucher error", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 500000 } as any,
      ]);

      prismaMock.promotion.findMany.mockResolvedValue([]);

      prismaMock.promotion.findUnique.mockResolvedValue({
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
      } as any);

      const res = await service.quote(
        [{ variantId: 1, quantity: 1 }],
        "EXHAUSTED",
      );
      expect(res.voucherError).toBe("Mã voucher đã hết lượt sử dụng");
      expect(res.voucherDiscount).toBe(0);
    });
  });
});
