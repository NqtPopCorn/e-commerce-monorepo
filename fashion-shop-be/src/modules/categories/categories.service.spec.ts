import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { CategoriesService } from "./categories.service";
import { NotFoundException } from "@nestjs/common";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe("create", () => {
    it("should create a category", async () => {
      prismaMock.category.create.mockResolvedValue({
        id: 1,
        name: "Shirts",
        parentId: null,
      } as any);
      const res = await service.create({ name: "Shirts" });
      expect(res.name).toBe("Shirts");
      expect(prismaMock.category.create).toHaveBeenCalled();
    });
  });

  describe("findAll / findTree", () => {
    it("should return categories list", async () => {
      prismaMock.category.findMany.mockResolvedValue([
        { id: 1, name: "A" },
      ] as any);
      const res = await service.findAll();
      expect(res.length).toBe(1);
    });

    it("should return category tree", async () => {
      prismaMock.category.findMany.mockResolvedValue([
        { id: 1, name: "A", children: [] },
      ] as any);
      const res = await service.findTree();
      expect(res.length).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return a category by id", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "A",
      } as any);
      const res = await service.findOne(1);
      expect(res.id).toBe(1);
    });

    it("should throw NotFoundException if category does not exist", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update / remove", () => {
    it("should throw NotFoundException on update if not found", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: "B" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should update successfully", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "A",
      } as any);
      prismaMock.category.update.mockResolvedValue({ id: 1, name: "B" } as any);
      const res = await service.update(1, { name: "B" });
      expect(res.name).toBe("B");
    });

    it("should throw NotFoundException on remove if not found", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it("should remove successfully", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "A",
      } as any);
      prismaMock.category.delete.mockResolvedValue({ id: 1, name: "A" } as any);
      const res = await service.remove(1);
      expect(res.id).toBe(1);
    });
  });
});
