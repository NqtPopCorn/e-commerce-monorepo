import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CampaignsService, getCampaignStatus } from "./campaigns.service";

describe("CampaignsService", () => {
  let service: CampaignsService;
  let prismaMock: DeepMockProxy<PrismaService>;
  let auditLogsMock: { log: jest.Mock };

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    auditLogsMock = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: auditLogsMock },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  describe("getCampaignStatus", () => {
    const fixedNow = new Date("2026-06-01T12:00:00Z");

    it("should return SCHEDULED when startsAt is in the future", () => {
      const startsAt = new Date("2026-06-02T00:00:00Z");
      expect(getCampaignStatus(startsAt, null, fixedNow)).toBe("SCHEDULED");
    });

    it("should return ACTIVE when startsAt has passed and endsAt is null", () => {
      const startsAt = new Date("2026-05-01T00:00:00Z");
      expect(getCampaignStatus(startsAt, null, fixedNow)).toBe("ACTIVE");
    });

    it("should return ACTIVE when startsAt has passed and endsAt is in future", () => {
      const startsAt = new Date("2026-05-01T00:00:00Z");
      const endsAt = new Date("2026-06-10T00:00:00Z");
      expect(getCampaignStatus(startsAt, endsAt, fixedNow)).toBe("ACTIVE");
    });

    it("should return ENDED when endsAt is in the past", () => {
      const startsAt = new Date("2026-05-01T00:00:00Z");
      const endsAt = new Date("2026-05-31T00:00:00Z");
      expect(getCampaignStatus(startsAt, endsAt, fixedNow)).toBe("ENDED");
    });
  });

  describe("create", () => {
    it("should create campaign, record audit log, and return derived status", async () => {
      const dto = {
        name: "Chiến dịch Hè 2026",
        description: "Trợ giá đồ mùa hè",
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: "2026-07-01T00:00:00.000Z",
        budgetLimit: 50000000,
      };

      const created = {
        id: 1,
        name: dto.name,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        budgetLimit: 50000000,
        spentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.campaign.create.mockResolvedValue(created as any);

      const result = await service.create(dto, {
        id: 10,
        email: "admin@shop.com",
      });

      expect(prismaMock.campaign.create).toHaveBeenCalledWith({
        data: {
          name: "Chiến dịch Hè 2026",
          description: "Trợ giá đồ mùa hè",
          startsAt: expect.any(Date),
          endsAt: expect.any(Date),
          budgetLimit: 50000000,
        },
      });

      expect(auditLogsMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CAMPAIGN_CREATE",
          entityType: "CAMPAIGN",
          entityId: "1",
        }),
      );

      expect(result.id).toBe(1);
      expect(result.status).toBeDefined();
    });

    it("should throw BadRequestException if endsAt <= startsAt", async () => {
      const dto = {
        name: "Lỗi ngày",
        startsAt: "2026-06-10T00:00:00.000Z",
        endsAt: "2026-06-05T00:00:00.000Z",
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated campaigns with derived statuses", async () => {
      prismaMock.campaign.count.mockResolvedValue(1);
      prismaMock.campaign.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Chiến dịch Hè",
          description: null,
          startsAt: new Date("2026-01-01"),
          endsAt: new Date("2026-12-31"),
          budgetLimit: 10000000,
          spentAmount: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { discounts: 2, vouchers: 3 },
        } as any,
      ]);

      const res = await service.findAll({ page: 1, limit: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.data[0].status).toBeDefined();
      expect(res.data[0]._count).toEqual({ discounts: 2, vouchers: 3 });
    });
  });

  describe("findOne", () => {
    it("should return campaign by id", async () => {
      prismaMock.campaign.findUnique.mockResolvedValue({
        id: 1,
        name: "Chiến dịch Hè",
        startsAt: new Date(),
        endsAt: null,
        discounts: [],
        vouchers: [],
        _count: { discounts: 0, vouchers: 0 },
      } as any);

      const res = await service.findOne(1);
      expect(res.id).toBe(1);
      expect(res.status).toBe("ACTIVE");
    });

    it("should throw NotFoundException if not found", async () => {
      prismaMock.campaign.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update campaign and log audit trail", async () => {
      prismaMock.campaign.findUnique.mockResolvedValue({
        id: 1,
        name: "Cũ",
        startsAt: new Date("2026-01-01"),
        endsAt: null,
        budgetLimit: null,
      } as any);

      prismaMock.campaign.update.mockResolvedValue({
        id: 1,
        name: "Mới",
        startsAt: new Date("2026-01-01"),
        endsAt: null,
        budgetLimit: 20000000,
      } as any);

      const res = await service.update(1, {
        name: "Mới",
        budgetLimit: 20000000,
      });
      expect(res.name).toBe("Mới");
      expect(auditLogsMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CAMPAIGN_UPDATE" }),
      );
    });
  });

  describe("remove", () => {
    it("should delete campaign and write audit log", async () => {
      prismaMock.campaign.findUnique.mockResolvedValue({
        id: 1,
        name: "Cần xóa",
        spentAmount: 0,
        _count: { discounts: 1, vouchers: 0 },
      } as any);
      prismaMock.campaign.delete.mockResolvedValue({ id: 1 } as any);

      const res = await service.remove(1);
      expect(res.success).toBe(true);
      expect(prismaMock.campaign.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(auditLogsMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CAMPAIGN_DELETE" }),
      );
    });
  });

  describe("getStats", () => {
    it("should aggregate revenue, discount amount, unique customers, and top products", async () => {
      const mockCampaign = {
        id: 1,
        name: "Campaign Stats Test",
        description: "Test stats",
        startsAt: new Date("2026-01-01"),
        endsAt: new Date("2026-12-31"),
        budgetLimit: 10000000,
        spentAmount: 500000,
        discounts: [
          {
            id: 10,
            name: "Giảm 10% áo",
            active: true,
            spentAmount: 300000,
            budgetLimit: null,
            maxUses: 100,
            usedCount: 2,
            startsAt: new Date(),
            endsAt: null,
            groups: [],
          },
        ],
        vouchers: [
          {
            id: 20,
            code: "VOUCHER10",
            name: "Voucher 10k",
            active: true,
            discountType: "FIXED",
            discountValue: 10000,
            maxDiscountValue: null,
            budgetLimit: null,
            spentAmount: 200000,
            maxUses: 50,
            usedCount: 1,
            startsAt: new Date(),
            endsAt: null,
          },
        ],
      };

      prismaMock.campaign.findUnique.mockResolvedValue(mockCampaign as any);

      prismaMock.discountApplication.findMany.mockResolvedValue([
        {
          id: 1,
          discountId: 10,
          discountAmount: 150000,
          order: {
            id: 101,
            userId: 5,
            status: "COMPLETED",
            total: 500000,
            createdAt: new Date(),
          },
          orderItem: {
            quantity: 2,
            variant: {
              productId: 1,
              sku: "AO-THUN-DEN-L",
              product: { id: 1, name: "Áo Thun Basic" },
            },
          },
        },
      ] as any);

      prismaMock.voucherApplication.findMany.mockResolvedValue([
        {
          id: 2,
          voucherId: 20,
          discountAmount: 10000,
          order: {
            id: 101,
            userId: 5,
            status: "COMPLETED",
            total: 500000,
            createdAt: new Date(),
          },
        },
      ] as any);

      const stats = await service.getStats(1);

      expect(stats.summary.totalDiscounts).toBe(1);
      expect(stats.summary.totalVouchers).toBe(1);
      expect(stats.summary.discountApplicationsCount).toBe(1);
      expect(stats.summary.voucherApplicationsCount).toBe(1);
      expect(stats.summary.totalApplicationsCount).toBe(2);
      expect(stats.summary.totalDiscountAmount).toBe(160000);
      expect(stats.summary.totalOrdersImpacted).toBe(1);
      expect(stats.summary.uniqueCustomerCount).toBe(1);
      expect(stats.summary.totalOrderRevenue).toBe(500000);

      expect(stats.topProducts).toHaveLength(1);
      expect(stats.topProducts[0].productName).toBe("Áo Thun Basic");
      expect(stats.topProducts[0].totalDiscount).toBe(150000);
    });
  });
});
