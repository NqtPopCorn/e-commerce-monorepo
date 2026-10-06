import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { CategoriesService } from "./categories.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

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
    it("should throw BadRequestException if name is empty", async () => {
      await expect(service.create({ name: "   " })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if category name already exists", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Shirts",
      } as any);
      await expect(service.create({ name: "Shirts" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException if parent category does not exist", async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null) // name check: null
        .mockResolvedValueOnce(null); // parent check: null

      await expect(
        service.create({ name: "T-Shirts", parentId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if parent is already a subcategory (depth >= 3)", async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null) // name check: null
        .mockResolvedValueOnce({ id: 2, name: "Polo", parentId: 1 } as any); // parent is level 2

      await expect(
        service.create({ name: "Cotton Polo", parentId: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create a root category (level 1)", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      prismaMock.category.create.mockResolvedValue({
        id: 1,
        name: "Shirts",
        parentId: null,
      } as any);
      const res = await service.create({ name: "Shirts" });
      expect(res.name).toBe("Shirts");
      expect(prismaMock.category.create).toHaveBeenCalled();
    });

    it("should create a leaf category (level 2) under a valid root parent", async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce({
          id: 1,
          name: "Shirts",
          parentId: null,
        } as any); // root parent

      prismaMock.category.create.mockResolvedValue({
        id: 2,
        name: "T-Shirts",
        parentId: 1,
      } as any);

      const res = await service.create({ name: "T-Shirts", parentId: 1 });
      expect(res.name).toBe("T-Shirts");
      expect(res.parentId).toBe(1);
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

  describe("update", () => {
    it("should throw NotFoundException on update if category not found", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: "B" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if setting self as parent", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "A",
        children: [],
        products: [],
      } as any);
      await expect(service.update(1, { parentId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if category has children and tries to become a subcategory", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Root",
        children: [{ id: 2, name: "Child" }],
        products: [],
      } as any);
      await expect(service.update(1, { parentId: 5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if target parent is not a root category", async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce({
          id: 3,
          name: "Child",
          children: [],
          products: [],
        } as any) // existing category
        .mockResolvedValueOnce({
          id: 2,
          name: "Other Child",
          parentId: 1,
        } as any); // target parent is level 2

      await expect(service.update(3, { parentId: 2 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if demoting subcategory to root while having products", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 2,
        name: "Child",
        parentId: 1,
        children: [],
        products: [{ id: 101 }],
      } as any);

      await expect(service.update(2, { parentId: null })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should update successfully", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "A",
        children: [],
        products: [],
      } as any);
      prismaMock.category.update.mockResolvedValue({ id: 1, name: "B" } as any);
      const res = await service.update(1, { name: "B" });
      expect(res.name).toBe("B");
    });
  });

  describe("remove", () => {
    it("should throw NotFoundException on remove if not found", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if category has children", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Root",
        children: [{ id: 2 }],
        products: [],
      } as any);
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if category has products", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 2,
        name: "Leaf",
        children: [],
        products: [{ id: 10 }],
      } as any);
      await expect(service.remove(2)).rejects.toThrow(BadRequestException);
    });

    it("should remove successfully if no children and no products", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: 2,
        name: "Leaf",
        children: [],
        products: [],
      } as any);
      prismaMock.category.delete.mockResolvedValue({
        id: 2,
        name: "Leaf",
      } as any);
      const res = await service.remove(2);
      expect(res.id).toBe(2);
    });
  });
});
