import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PromotionsService } from "./promotions.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DiscountType, PromotionApplicationType } from "@prisma/client";

describe("PromotionsService", () => {
  let service: PromotionsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe("validatePromotionPayload (via create/update)", () => {
    it("should throw if startsAt >= endsAt", async () => {
      await expect(
        service.create({
          applicationType: PromotionApplicationType.VOUCHER,
          name: "test",
          code: "TEST1",
          startsAt: new Date("2026-02-01").toISOString(),
          endsAt: new Date("2026-01-01").toISOString(),
          groups: [
            {
              name: "G1",
              discountType: DiscountType.FIXED,
              discountValue: 10000,
            },
          ],
        } as any),
      ).rejects.toThrow("thời gian kết thúc");
    });

    it("should throw if Voucher has no code or vouchers array", async () => {
      await expect(
        service.create({
          applicationType: PromotionApplicationType.VOUCHER,
          name: "Voucher",
          startsAt: new Date("2026-01-01").toISOString(),
          groups: [
            {
              name: "G1",
              discountType: DiscountType.FIXED,
              discountValue: 10000,
            },
          ],
        } as any),
      ).rejects.toThrow("bắt buộc phải có ít nhất 1 mã code");
    });

    it("should throw if Promotion has no groups", async () => {
      await expect(
        service.create({
          applicationType: PromotionApplicationType.AUTO,
          name: "Auto Promo",
          startsAt: new Date("2026-01-01").toISOString(),
          groups: [],
        } as any),
      ).rejects.toThrow("phải có ít nhất 1 nhóm quy tắc chiết khấu");
    });

    it("should throw if group percent discount is invalid", async () => {
      await expect(
        service.create({
          applicationType: PromotionApplicationType.AUTO,
          name: "Auto Promo",
          startsAt: new Date("2026-01-01").toISOString(),
          groups: [
            {
              name: "Invalid Percent",
              discountType: DiscountType.PERCENT,
              discountValue: 120,
            },
          ],
        } as any),
      ).rejects.toThrow("Phần trăm giảm giá phải là số nguyên từ 1 đến 100");
    });
  });

  describe("checkCode", () => {
    it("should return voucher if valid", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        code: "VOUCHER10",
        active: true,
        endsAt: new Date("2099-01-01"),
        promotion: {
          active: true,
          budgetLimit: null,
          spentAmount: 0,
          campaign: null,
          groups: [],
        },
      } as any);
      const res = await service.checkCode("VOUCHER10");
      expect(res.code).toBe("VOUCHER10");
    });

    it("should throw if not found", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(null);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw if voucher is inactive", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        code: "VOUCHER10",
        active: false,
        promotion: { active: true },
      } as any);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        "đã bị khoá",
      );
    });

    it("should throw if expired", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        code: "VOUCHER10",
        active: true,
        endsAt: new Date("2000-01-01"),
        promotion: { active: true },
      } as any);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        "đã hết hạn",
      );
    });

    it("should throw if maxUses reached", async () => {
      prismaMock.voucher.findUnique.mockResolvedValue({
        code: "VOUCHER10",
        active: true,
        maxUses: 10,
        usedCount: 10,
        promotion: { active: true },
      } as any);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        "đã hết lượt sử dụng",
      );
    });
  });

  describe("update & remove", () => {
    it("should update successfully", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue({
        id: 1,
        applicationType: PromotionApplicationType.AUTO,
      } as any);
      prismaMock.promotion.update.mockResolvedValue({
        id: 1,
        name: "New",
      } as any);

      const res = await service.update(1, { name: "New" });
      expect(res.name).toBe("New");
    });

    it("should throw NotFoundException on remove if not found", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
