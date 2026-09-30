import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PurchasesService } from "./purchases.service";
import { NotFoundException } from "@nestjs/common";

describe("PurchasesService", () => {
  let service: PurchasesService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  describe("create", () => {
    it("should create a purchase receipt, calculate total amount, and increment stock for all items", async () => {
      const dto = {
        code: "PN-TEST-001",
        supplier: "Test Supplier",
        note: "Initial test purchase",
        items: [
          { variantId: 1, quantity: 10, costPrice: 100000 },
          { variantId: 2, quantity: 5, costPrice: 200000 },
        ],
      };

      const mockReceipt = {
        id: 1,
        code: "PN-TEST-001",
        supplier: "Test Supplier",
        note: "Initial test purchase",
        totalAmount: 2000000,
        status: "COMPLETED",
        items: [],
      };

      prismaMock.purchaseReceipt.create.mockResolvedValue(mockReceipt as any);
      prismaMock.productVariant.update.mockResolvedValue({ id: 1 } as any);

      const result = await service.create(dto);

      expect(prismaMock.purchaseReceipt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: "PN-TEST-001",
            supplier: "Test Supplier",
            totalAmount: 2000000, // 10 * 100000 + 5 * 200000 = 2,000,000
          }),
        }),
      );

      expect(prismaMock.productVariant.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 10 } },
      });
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { stock: { increment: 5 } },
      });

      expect(result).toEqual(mockReceipt);
    });

    it("should auto-generate code if not provided", async () => {
      const dto = {
        items: [{ variantId: 1, quantity: 2, costPrice: 50000 }],
      };

      prismaMock.purchaseReceipt.create.mockResolvedValue({ id: 1 } as any);

      await service.create(dto);

      expect(prismaMock.purchaseReceipt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: expect.stringMatching(/^PN-/),
            supplier: "Fashion Shop Official",
            totalAmount: 100000,
          }),
        }),
      );
    });
  });

  describe("findAll", () => {
    it("should return unpaginated list when page and limit are undefined", async () => {
      const mockList = [
        { id: 1, code: "PN-001" },
        { id: 2, code: "PN-002" },
      ];
      prismaMock.purchaseReceipt.findMany.mockResolvedValue(mockList as any);

      const res = await service.findAll();
      expect(res).toEqual(mockList);
      expect(prismaMock.purchaseReceipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("should return paginated data with meta when page and limit are provided", async () => {
      const mockList = [{ id: 1, code: "PN-001" }];
      prismaMock.purchaseReceipt.count.mockResolvedValue(25);
      prismaMock.purchaseReceipt.findMany.mockResolvedValue(mockList as any);

      const res = await service.findAll({ page: 2, limit: 10 });
      expect(res).toEqual({
        data: mockList,
        meta: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      });

      expect(prismaMock.purchaseReceipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("should filter by search and supplier", async () => {
      prismaMock.purchaseReceipt.findMany.mockResolvedValue([]);

      await service.findAll({ search: "Ao thun", supplier: "Zara" });

      expect(prismaMock.purchaseReceipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supplier: expect.objectContaining({ contains: "Zara" }),
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe("getStats", () => {
    it("should aggregate total purchases, total spending, and total quantity", async () => {
      prismaMock.purchaseReceipt.count.mockResolvedValue(15);
      prismaMock.purchaseReceipt.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000000 as any },
      } as any);
      prismaMock.purchaseReceiptItem.aggregate.mockResolvedValue({
        _sum: { quantity: 350 },
      } as any);

      const res = await service.getStats();

      expect(res).toEqual({
        totalPurchases: 15,
        totalSpending: 50000000,
        totalQuantity: 350,
      });
    });
  });

  describe("findOne", () => {
    it("should return a purchase receipt when found", async () => {
      const mockReceipt = { id: 1, code: "PN-001" };
      prismaMock.purchaseReceipt.findUnique.mockResolvedValue(
        mockReceipt as any,
      );

      const res = await service.findOne(1);
      expect(res).toEqual(mockReceipt);
    });

    it("should throw NotFoundException when receipt does not exist", async () => {
      prismaMock.purchaseReceipt.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
