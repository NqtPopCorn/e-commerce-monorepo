import { Test, TestingModule } from "@nestjs/testing";
import { PromotionPricingService } from "./promotion-pricing.service";
import { PrismaService } from "../../prisma/prisma.service";
import { DiscountType, PromotionApplicationType } from "@prisma/client";
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
          applicationType: PromotionApplicationType.AUTO,
          priority: 5,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
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
          applicationType: PromotionApplicationType.AUTO,
          priority: 10,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
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
          applicationType: PromotionApplicationType.AUTO,
          priority: 10,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
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
          applicationType: PromotionApplicationType.AUTO,
          priority: 10,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
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
          applicationType: PromotionApplicationType.AUTO,
          minOrderAmount: 300000,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
          groups: [
            {
              discountType: DiscountType.FIXED,
              discountValue: 50000,
              variants: [],
            },
          ],
        } as any,
        {
          id: 2,
          name: "Auto Promo 20%",
          applicationType: PromotionApplicationType.AUTO,
          minOrderAmount: 400000,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
          groups: [
            {
              discountType: DiscountType.PERCENT,
              discountValue: 20,
              variants: [],
            },
          ],
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
          applicationType: PromotionApplicationType.AUTO,
          minOrderAmount: 300000,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
          groups: [
            {
              discountType: DiscountType.FIXED,
              discountValue: 100000,
              variants: [],
            },
          ],
        } as any,
      ]);

      prismaMock.voucher.findUnique.mockResolvedValue({
        id: 99,
        code: "VOUCHER10",
        active: true,
        startsAt: new Date("2026-01-01"),
        usedCount: 0,
        maxUses: 10,
        promotion: {
          id: 99,
          name: "Voucher 10%",
          applicationType: PromotionApplicationType.VOUCHER,
          minOrderAmount: 300000,
          active: true,
          startsAt: new Date("2026-01-01"),
          usedCount: 0,
          maxUses: 10,
          budgetLimit: null,
          spentAmount: 0,
          groups: [
            {
              discountType: DiscountType.PERCENT,
              discountValue: 10,
            },
          ],
        },
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

      prismaMock.voucher.findUnique.mockResolvedValue({
        id: 99,
        code: "EXHAUSTED",
        active: true,
        startsAt: new Date("2026-01-01"),
        usedCount: 10,
        maxUses: 10,
        promotion: {
          id: 99,
          name: "Exhausted Voucher",
          applicationType: PromotionApplicationType.VOUCHER,
          active: true,
          startsAt: new Date("2026-01-01"),
          budgetLimit: null,
          spentAmount: 0,
          groups: [
            {
              discountType: DiscountType.FIXED,
              discountValue: 50000,
            },
          ],
        },
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
