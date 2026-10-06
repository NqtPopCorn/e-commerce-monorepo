import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { ProductsService } from "./products.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("ProductsService", () => {
  let service: ProductsService;
  let prismaMock: DeepMockProxy<PrismaService>;
  let pricingMock: any;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    pricingMock = {
      calculateVariantsPrice: jest
        .fn()
        .mockImplementation((variants) => variants),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PricingService, useValue: pricingMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe("create", () => {
    it("should throw NotFoundException if category does not exist", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          name: "Áo Thun",
          categoryId: 999,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if category is a root category (parentId is null)", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo",
        parentId: null,
      } as any);

      await expect(
        service.create({
          name: "Áo Thun",
          categoryId: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create a product and generate slug if not provided when category is leaf", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 2,
        name: "Áo Thun",
        parentId: 1,
      } as any);

      prismaMock.product.create.mockResolvedValue({
        id: 1,
        name: "Áo Thun",
        slug: "ao-thun-123",
      } as any);

      const res = await service.create({
        name: "Áo Thun",
        categoryId: 2,
        brandId: 1,
      } as any);

      expect(res.name).toBe("Áo Thun");
      expect(res.slug).toBe("ao-thun-123");
      expect(prismaMock.product.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated products", async () => {
      prismaMock.product.count.mockResolvedValue(1);
      prismaMock.product.findMany.mockResolvedValue([
        { id: 1, name: "A" },
      ] as any);

      const res = (await service.findAll({ page: 1, limit: 10 })) as any;
      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });

    it("should return all products if no pagination", async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: 1, name: "A" },
      ] as any);

      const res = (await service.findAll()) as any;
      expect(res.length).toBe(1);
    });

    it("should filter by parent categoryId including children", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo",
        children: [{ id: 2 }, { id: 3 }],
      } as any);
      prismaMock.product.findMany.mockResolvedValue([
        { id: 10, name: "Áo Thun", categoryId: 2 },
      ] as any);

      const res = (await service.findAll({ categoryId: 1 })) as any;
      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: [1, 2, 3] },
          }),
        }),
      );
      expect(res.length).toBe(1);
    });

    it("should filter by parent category name including children", async () => {
      prismaMock.category.findFirst.mockResolvedValue({
        id: 1,
        name: "Áo",
        children: [{ id: 2 }, { id: 3 }],
      } as any);
      prismaMock.product.findMany.mockResolvedValue([
        { id: 10, name: "Áo Thun", categoryId: 2 },
      ] as any);

      const res = (await service.findAll({ category: "Áo" })) as any;
      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: [1, 2, 3] },
          }),
        }),
      );
      expect(res.length).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should calculate stats correctly", async () => {
      prismaMock.product.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2);
      prismaMock.productVariant.findMany.mockResolvedValue([
        { stock: 10, sellingPrice: 100, productId: 1 } as any,
        { stock: 0, sellingPrice: 200, productId: 2 } as any,
      ]);

      const stats = await service.getStats();
      expect(stats.totalProducts).toBe(10);
      expect(stats.newThisWeek).toBe(2);
      expect(stats.totalStockValue).toBe(1000);
      expect(stats.outOfStock).toBe(1);
    });
  });

  describe("findOne / findBySlug", () => {
    it("should find product by id", async () => {
      prismaMock.product.findUnique.mockResolvedValue({ id: 1 } as any);
      const res = await service.findOne(1);
      expect(res.id).toBe(1);
    });

    it("should throw NotFoundException if id missing", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("should find product by slug", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        slug: "test",
      } as any);
      const res = await service.findBySlug("test");
      expect(res.slug).toBe("test");
    });
  });

  describe("update", () => {
    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb(prismaMock),
      );
    });

    it("should throw BadRequestException when trying to assign a root category on update", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo Polo",
        variants: [],
      } as any);

      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Root Áo",
        parentId: null,
      } as any);

      await expect(service.update(1, { categoryId: 1 } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when trying to delete a variant that has stock > 0", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo Polo",
        variants: [
          { id: 10, sku: "POLO-M", stock: 5 },
          { id: 11, sku: "POLO-L", stock: 0 },
        ],
      } as any);

      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 10, sku: "POLO-M", stock: 5 },
        { id: 11, sku: "POLO-L", stock: 0 },
      ] as any);

      // Payload omits POLO-M (intending to delete it)
      const updateDto = {
        name: "Áo Polo V2",
        variants: [
          { sku: "POLO-L", stock: 0, listPrice: 200, sellingPrice: 180 },
        ],
      };

      await expect(service.update(1, updateDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should successfully update and delete variant with stock === 0", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo Polo",
        variants: [
          { id: 10, sku: "POLO-M", stock: 0 },
          { id: 11, sku: "POLO-L", stock: 0 },
        ],
      } as any);

      prismaMock.productVariant.findMany.mockResolvedValue([
        { id: 10, sku: "POLO-M", stock: 0 },
        { id: 11, sku: "POLO-L", stock: 0 },
      ] as any);

      prismaMock.productVariant.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.productVariant.update.mockResolvedValue({
        id: 11,
        sku: "POLO-L",
      } as any);
      prismaMock.product.update.mockResolvedValue({
        id: 1,
        name: "Áo Polo V2",
      } as any);

      const updateDto = {
        name: "Áo Polo V2",
        variants: [
          { sku: "POLO-L", stock: 0, listPrice: 200, sellingPrice: 180 },
        ],
      };

      const result = await service.update(1, updateDto as any);
      expect(prismaMock.productVariant.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [10] } },
      });
      expect(result.name).toBe("Áo Polo V2");
    });
  });

  describe("remove", () => {
    it("should throw BadRequestException when product has variants with stock > 0", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo Polo",
        variants: [{ id: 10, sku: "POLO-M", stock: 8 }],
      } as any);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it("should successfully delete product when all variants have stock === 0", async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Áo Polo",
        variants: [{ id: 10, sku: "POLO-M", stock: 0 }],
      } as any);
      prismaMock.product.delete.mockResolvedValue({ id: 1 } as any);

      const res = await service.remove(1);
      expect(res.id).toBe(1);
      expect(prismaMock.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
