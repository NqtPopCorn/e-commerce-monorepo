import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PromotionsService } from "./promotions.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DiscountType, PromotionKind } from "@prisma/client";

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
          kind: PromotionKind.VOUCHER,
          name: "test",
          startsAt: new Date("2026-02-01"),
          endsAt: new Date("2026-01-01"),
        } as any),
      ).rejects.toThrow("thời gian kết thúc");
    });

    it("should throw if Voucher has no code", async () => {
      await expect(
        service.create({ kind: PromotionKind.VOUCHER, name: "Voucher" } as any),
      ).rejects.toThrow("bắt buộc phải có mã code");
    });

    it("should throw if Voucher has groups", async () => {
      await expect(
        service.create({
          kind: PromotionKind.VOUCHER,
          code: "V1",
          groups: [{}],
        } as any),
      ).rejects.toThrow("không được chứa campaign groups");
    });

    it("should throw if Auto Promo has code", async () => {
      await expect(
        service.create({
          kind: PromotionKind.ORDER_AUTO,
          code: "AUTO1",
        } as any),
      ).rejects.toThrow("không được chứa mã code");
    });

    it("should throw if Campaign has code", async () => {
      await expect(
        service.create({
          kind: PromotionKind.CAMPAIGN,
          code: "CAMP1",
          groups: [{}],
        } as any),
      ).rejects.toThrow("không được chứa mã code");
    });
  });

  describe("checkCode", () => {
    it("should return voucher if valid", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue({
        code: "VOUCHER10",
        active: true,
        endsAt: new Date("2099-01-01"),
      } as any);
      const res = await service.checkCode("VOUCHER10");
      expect(res.code).toBe("VOUCHER10");
    });

    it("should throw if not found", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(null);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw if inactive", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue({
        active: false,
      } as any);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        "đã bị khoá",
      );
    });

    it("should throw if expired", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue({
        active: true,
        endsAt: new Date("2000-01-01"),
      } as any);
      await expect(service.checkCode("VOUCHER10")).rejects.toThrow(
        "đã hết hạn",
      );
    });

    it("should throw if maxUses reached", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue({
        active: true,
        maxUses: 10,
        usedCount: 10,
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
        kind: PromotionKind.VOUCHER,
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
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
