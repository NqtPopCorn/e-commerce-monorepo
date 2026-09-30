import { Test, TestingModule } from "@nestjs/testing";
import { PromotionPricingService } from "../promotions/promotion-pricing.service";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { OrdersService } from "./orders.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("OrdersService", () => {
  let service: OrdersService;
  let prismaMock: DeepMockProxy<PrismaService>;
  let pricingMock: any;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    pricingMock = { quote: jest.fn() };

    // Giả lập Prisma $transaction callback ngay lập tức với prismaMock
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PromotionPricingService, useValue: pricingMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe("create", () => {
    const mockDto = { items: [{ variantId: 1, quantity: 2 }] };

    it("should create an order successfully", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, stock: 10, sku: "SKU1" } as any,
      ]);

      pricingMock.quote.mockResolvedValue({
        subtotal: 200000,
        productDiscount: 0,
        orderDiscount: 0,
        voucherDiscount: 0,
        total: 200000,
        lines: [
          {
            variantId: 1,
            quantity: 2,
            originalUnitPrice: 100000,
            productDiscount: 0,
            finalUnitPrice: 100000,
          },
        ],
        applied: [],
        voucherError: null,
      });

      prismaMock.order.create.mockResolvedValue({
        id: 1,
        items: [{ id: 101, variantId: 1 }],
      } as any);
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        total: 200000,
      } as any);

      const result = await service.create(1, mockDto);
      expect(result!.total).toBe(200000);
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { decrement: 2 } },
      });
      expect(prismaMock.order.create).toHaveBeenCalled();
    });

    it("should throw NotFoundException if variant does not exist", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([]);
      await expect(service.create(1, mockDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if stock is insufficient", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, stock: 1, sku: "SKU1" } as any, // Only 1 in stock, trying to order 2
      ]);
      await expect(service.create(1, mockDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if voucher is exhausted", async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 1, stock: 10 } as any,
      ]);

      pricingMock.quote.mockResolvedValue({
        subtotal: 200000,
        lines: [],
        applied: [{ scope: "VOUCHER", id: 99 }],
      });

      // Mock maxUses exceeded
      prismaMock.promotion.findUnique.mockResolvedValue({
        id: 99,
        active: true,
        maxUses: 1,
        usedCount: 1,
      } as any);

      await expect(service.create(1, mockDto)).rejects.toThrow(
        "Voucher đã hết lượt sử dụng hoặc không khả dụng",
      );
    });
  });

  describe("findMine / findOne", () => {
    it("should return my orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([{ id: 1 }] as any);
      const res = await service.findMine(1);
      expect(res.length).toBe(1);
    });

    it("should return a specific order", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
      } as any);
      const res = await service.findOne(1, 1);
      expect(res.id).toBe(1);
    });

    it("should throw NotFoundException if order does not belong to user", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 2,
      } as any);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("cancel", () => {
    it("should cancel a PENDING order successfully and restore stock", async () => {
      const orderData = {
        id: 1,
        userId: 1,
        status: "PENDING",
        items: [{ variantId: 1, quantity: 2 }],
      };

      prismaMock.order.findUnique.mockResolvedValue(orderData as any);
      prismaMock.order.update.mockResolvedValue({
        id: 1,
        status: "CANCELLED",
      } as any);

      const res = await service.cancel(1, 1);

      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 2 } },
      });
      expect(res.status).toBe("CANCELLED");
    });

    it("should throw BadRequestException if order is not PENDING", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        status: "COMPLETED",
      } as any);
      await expect(service.cancel(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
