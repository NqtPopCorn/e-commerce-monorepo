import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { BrandsService } from "./brands.service";
import { NotFoundException } from "@nestjs/common";

describe("BrandsService", () => {
  let service: BrandsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  describe("create", () => {
    it("should create a brand", async () => {
      prismaMock.brand.create.mockResolvedValue({ id: 1, name: "Nike" } as any);
      const res = await service.create({ name: "Nike" });
      expect(res.name).toBe("Nike");
      expect(prismaMock.brand.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all brands", async () => {
      prismaMock.brand.findMany.mockResolvedValue([
        { id: 1, name: "Nike" },
      ] as any);
      const res = await service.findAll();
      expect(res.length).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should find brand by id", async () => {
      prismaMock.brand.findUnique.mockResolvedValue({
        id: 1,
        name: "Nike",
      } as any);
      const res = await service.findOne(1);
      expect(res.id).toBe(1);
    });

    it("should throw NotFoundException if brand not found", async () => {
      prismaMock.brand.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update & remove", () => {
    it("should throw NotFoundException on update if not found", async () => {
      prismaMock.brand.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: "Adidas" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException on remove if not found", async () => {
      prismaMock.brand.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it("should update successfully", async () => {
      prismaMock.brand.findUnique.mockResolvedValue({
        id: 1,
        name: "Nike",
      } as any);
      prismaMock.brand.update.mockResolvedValue({
        id: 1,
        name: "Adidas",
      } as any);
      const res = await service.update(1, { name: "Adidas" });
      expect(res.name).toBe("Adidas");
    });
  });
});
