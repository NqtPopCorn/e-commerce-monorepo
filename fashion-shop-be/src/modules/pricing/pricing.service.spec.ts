import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DiscountType } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { PrismaService } from "../../prisma/prisma.service";
import { PricingService } from "./pricing.service";

describe("PricingService", () => {
  let service: PricingService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  describe("Validation", () => {
    it("should throw if items array is empty", async () => {
      await expect(service.quote([])).rejects.toThrow(BadRequestException);
    });

    it("should throw if item quantity <= 0", async () => {
      await expect(
        service.quote([{ variantId: 1, quantity: 0 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if variant does not exist in DB", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([]);
      await expect(
        service.quote([{ variantId: 999, quantity: 1 }]),
      ).rejects.toThrow("Sản phẩm biến thể ID 999 không tồn tại trong hệ thống");
    });
  });

  describe("Item-level Discounts (LINE)", () => {
    beforeEach(() => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 200000 as any } as any,
        { id: 2, sellingPrice: 150000 as any } as any,
      ]);
    });

    it("should apply percentage discount with max cap", async () => {
      prismaMock.discount.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Flash Sale 20%",
          priority: 10,
          budgetLimit: null,
          spentAmount: 0 as any,
          campaign: null,
          groups: [
            {
              id: 10,
              discountType: DiscountType.PERCENT,
              discountValue: 20 as any,
              maxDiscountValue: 30000 as any, // 20% của 200k = 40k, cap 30k
              variants: [{ variantId: 1 }],
            },
          ],
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);

      expect(res.subtotal).toBe(200000);
      expect(res.productDiscount).toBe(30000);
      expect(res.voucherDiscount).toBe(0);
      expect(res.total).toBe(170000);
      expect(res.lines[0].finalUnitPrice).toBe(170000);
      expect(res.appliedDiscounts).toHaveLength(1);
      expect(res.appliedDiscounts[0].discountAmount).toBe(30000);
    });

    it("should select winning discount by highest priority", async () => {
      prismaMock.discount.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Discount Thấp (Ưu tiên 5)",
          priority: 5,
          budgetLimit: null,
          spentAmount: 0 as any,
          campaign: null,
          groups: [
            {
              id: 10,
              discountType: DiscountType.FIXED,
              discountValue: 50000 as any,
              maxDiscountValue: null,
              variants: [{ variantId: 1 }],
            },
          ],
        } as any,
        {
          id: 2,
          name: "Discount Cao (Ưu tiên 10)",
          priority: 10,
          budgetLimit: null,
          spentAmount: 0 as any,
          campaign: null,
          groups: [
            {
              id: 20,
              discountType: DiscountType.FIXED,
              discountValue: 30000 as any,
              maxDiscountValue: null,
              variants: [{ variantId: 1 }],
            },
          ],
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);

      // Ưu tiên 10 phải thắng dù số tiền 30k < 50k
      expect(res.productDiscount).toBe(30000);
      expect(res.appliedDiscounts[0].discountId).toBe(2);
    });

    it("should cap discount by discount budgetLimit", async () => {
      prismaMock.discount.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Sale Ngân Sách Hạn Hẹp",
          priority: 10,
          budgetLimit: 25000 as any, // Chỉ còn 25k ngân sách
          spentAmount: 0 as any,
          campaign: null,
          groups: [
            {
              id: 10,
              discountType: DiscountType.FIXED,
              discountValue: 50000 as any,
              maxDiscountValue: null,
              variants: [{ variantId: 1 }],
            },
          ],
        } as any,
      ]);

      const res = await service.quote([{ variantId: 1, quantity: 1 }]);
      expect(res.productDiscount).toBe(25000);
      expect(res.total).toBe(175000);
    });
  });

  describe("Order-level Vouchers", () => {
    beforeEach(() => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, sellingPrice: 500000 as any } as any,
      ]);
      prismaMock.discount.findMany.mockResolvedValue([]);
    });

    it("should apply voucher successfully on subtotal", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        id: 100,
        code: "SALE10",
        name: "Giảm 10%",
        active: true,
        startsAt: new Date(Date.now() - 10000),
        endsAt: new Date(Date.now() + 100000),
        maxUses: 100,
        usedCount: 0,
        minOrderAmount: 300000 as any,
        discountType: DiscountType.PERCENT,
        discountValue: 10 as any,
        maxDiscountValue: 100000 as any,
        budgetLimit: null,
        spentAmount: 0 as any,
        campaign: null,
      } as any);

      const res = await service.quote(
        [{ variantId: 1, quantity: 1 }],
        "SALE10",
      );

      expect(res.subtotal).toBe(500000);
      expect(res.productDiscount).toBe(0);
      expect(res.voucherDiscount).toBe(50000); // 10% của 500k
      expect(res.total).toBe(450000);
      expect(res.appliedVoucher).toEqual({
        voucherId: 100,
        voucherCode: "SALE10",
        voucherName: "Giảm 10%",
        discountAmount: 50000,
      });
      expect(res.voucherError).toBeUndefined();
    });

    it("should reject voucher if minOrderAmount not reached", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        id: 100,
        code: "VIP1M",
        name: "Giảm đơn 1 triệu",
        active: true,
        startsAt: new Date(Date.now() - 10000),
        endsAt: new Date(Date.now() + 100000),
        maxUses: 100,
        usedCount: 0,
        minOrderAmount: 1000000 as any, // Cần đơn 1 triệu, nhưng giỏ hàng có 500k
        discountType: DiscountType.FIXED,
        discountValue: 100000 as any,
        budgetLimit: null,
        spentAmount: 0 as any,
        campaign: null,
      } as any);

      const res = await service.quote(
        [{ variantId: 1, quantity: 1 }],
        "VIP1M",
      );

      expect(res.voucherDiscount).toBe(0);
      expect(res.voucherError).toBe(
        "Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher này",
      );
      expect(res.total).toBe(500000);
    });

    it("should calculate combined Line Discount and Voucher correctly", async () => {
      // 1 variant giá 500k, có Line discount giảm 100k -> subtotalAfterDiscount = 400k
      // Voucher giảm 10% trên 400k = 40k
      // Total = 500k - 100k - 40k = 360k
      prismaMock.discount.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Giảm 100k sản phẩm",
          priority: 1,
          budgetLimit: null,
          spentAmount: 0 as any,
          campaign: null,
          groups: [
            {
              id: 10,
              discountType: DiscountType.FIXED,
              discountValue: 100000 as any,
              maxDiscountValue: null,
              variants: [{ variantId: 1 }],
            },
          ],
        } as any,
      ]);

      prismaMock.voucher.findUnique.mockResolvedValue({
        id: 200,
        code: "VOUCHER10",
        name: "Voucher 10%",
        active: true,
        startsAt: new Date(Date.now() - 10000),
        endsAt: new Date(Date.now() + 100000),
        maxUses: 50,
        usedCount: 0,
        minOrderAmount: 300000 as any, // 400k >= 300k -> Đạt
        discountType: DiscountType.PERCENT,
        discountValue: 10 as any,
        maxDiscountValue: 50000 as any,
        budgetLimit: null,
        spentAmount: 0 as any,
        campaign: null,
      } as any);

      const res = await service.quote(
        [{ variantId: 1, quantity: 1 }],
        "VOUCHER10",
      );

      expect(res.subtotal).toBe(500000);
      expect(res.productDiscount).toBe(100000);
      expect(res.voucherDiscount).toBe(40000); // 10% của 400k
      expect(res.total).toBe(360000);
      expect(res.appliedDiscounts).toHaveLength(1);
      expect(res.appliedVoucher?.voucherCode).toBe("VOUCHER10");
    });
  });
});
