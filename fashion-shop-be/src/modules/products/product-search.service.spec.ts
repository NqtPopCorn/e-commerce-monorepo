import { Test, TestingModule } from "@nestjs/testing";
import { GenderTarget } from "@prisma/client";
import { PricingService } from "../pricing/pricing.service";
import { EmbeddingService } from "./embedding.service";
import { ProductSearchRepository } from "./product-search.repository";
import { ProductSearchService } from "./product-search.service";

describe("ProductSearchService", () => {
  let service: ProductSearchService;
  let repoMock: jest.Mocked<ProductSearchRepository>;
  let pricingMock: { calculateVariantsPrice: jest.Mock };
  let embeddingMock: {
    getEmbeddingModel: jest.Mock;
    getEmbeddingDim: jest.Mock;
    getMinSimilarity: jest.Mock;
    generateEmbedding: jest.Mock;
  };

  beforeEach(async () => {
    repoMock = {
      findProductForEmbedding: jest.fn(),
      updateProductSearchVectors: jest.fn(),
      resolveCategoryIds: jest.fn(),
      queryHybridRankedIds: jest.fn(),
      computeFacets: jest.fn(),
      findProductsByIdsWithRelations: jest.fn(),
    } as unknown as jest.Mocked<ProductSearchRepository>;

    pricingMock = {
      calculateVariantsPrice: jest
        .fn()
        .mockImplementation(async (variants) => variants),
    };

    embeddingMock = {
      getEmbeddingModel: jest.fn().mockReturnValue("bge-m3"),
      getEmbeddingDim: jest.fn().mockReturnValue(4),
      getMinSimilarity: jest.fn().mockReturnValue(0.35),
      generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchService,
        { provide: ProductSearchRepository, useValue: repoMock },
        { provide: PricingService, useValue: pricingMock },
        { provide: EmbeddingService, useValue: embeddingMock },
      ],
    }).compile();

    service = module.get<ProductSearchService>(ProductSearchService);
  });

  describe("syncProductEmbedding", () => {
    it("should save vector, model, and search text when embedding succeeds", async () => {
      repoMock.findProductForEmbedding.mockResolvedValue({
        id: 1,
        name: "Áo Thun Riley",
        targetGender: GenderTarget.MALE,
        fit: "Regular Fit",
        pattern: "Trơn Basic",
        occasion: "Đi làm",
        material: "100% Cotton",
        season: "Xuân Hè",
        description: "Thoáng mát",
        category: { name: "Áo thun", parent: { name: "Áo" } },
        brand: { name: "H&M" },
        variants: [{ color: "Đen", size: "L" }],
      } as any);

      await service.syncProductEmbedding(1);

      expect(repoMock.updateProductSearchVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          vector: [0.1, 0.2, 0.3, 0.4],
          embeddingModel: "bge-m3",
          embeddingText: expect.stringContaining("Phom dáng: Regular Fit"),
          searchText: expect.stringContaining("Áo Thun Riley"),
        }),
      );
    });

    it("should still save search_vector text when Ollama returns null", async () => {
      embeddingMock.generateEmbedding.mockResolvedValueOnce(null);
      repoMock.findProductForEmbedding.mockResolvedValue({
        id: 2,
        name: "Áo Polo",
        variants: [],
      } as any);

      await service.syncProductEmbedding(2);

      expect(repoMock.updateProductSearchVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          vector: null,
          searchText: expect.stringContaining("Áo Polo"),
        }),
      );
    });
  });

  describe("searchForAssistant", () => {
    it("should preserve ranked order and attach scores, facets, and priceRange", async () => {
      repoMock.resolveCategoryIds.mockResolvedValue({
        categoryIds: [2],
        notFound: false,
      });
      repoMock.queryHybridRankedIds.mockResolvedValue({
        rows: [
          { id: 20, rrfScore: 0.032, denseScore: 0.72, ftsScore: 0.35 },
          { id: 10, rrfScore: 0.016, denseScore: 0.61, ftsScore: 0 },
        ],
        total: 2,
        strategy: "hybrid_rrf",
      });
      repoMock.computeFacets.mockResolvedValue({
        priceRange: { min: 200000, max: 500000 },
        availableColors: ["Đen", "Trắng"],
        availableSizes: ["M", "L"],
      });
      repoMock.findProductsByIdsWithRelations.mockResolvedValue([
        {
          id: 10,
          name: "Áo 10",
          images: [{ url: "img10.jpg" }],
          variants: [
            {
              id: 101,
              color: "Trắng",
              size: "M",
              listPrice: 300000,
              sellingPrice: 250000,
              finalPrice: 250000,
              stock: 5,
            },
          ],
        },
        {
          id: 20,
          name: "Áo 20",
          images: [{ url: "img20.jpg" }],
          variants: [
            {
              id: 201,
              color: "Đen",
              size: "L",
              listPrice: 400000,
              sellingPrice: 300000,
              finalPrice: 300000,
              stock: 3,
            },
          ],
        },
      ] as any);

      const res = await service.searchForAssistant({
        query: "áo thun đen",
        filters: { categories: ["Áo thun"], colors: ["Đen"], sizes: ["L"] },
        limit: 5,
      });

      expect(res.items.map((i: any) => i.id)).toEqual([20, 10]);
      expect(res.items[0].scores).toEqual({
        rrf: 0.032,
        dense: 0.72,
        fts: 0.35,
      });
      expect(res.items[0].availableColors).toEqual(["Đen"]);
      expect(res.items[0].availableSizes).toEqual(["L"]);
      expect(res.items[0].priceRange).toEqual({
        minFinal: 300000,
        maxList: 400000,
        discountPercent: 25,
      });
      expect(res.meta.relaxedFilters).toEqual([]);
      expect(res.meta.facets.availableColors).toEqual(["Đen", "Trắng"]);
    });

    it("should relax colors/sizes then maxPrice when strict filter returns 0", async () => {
      repoMock.resolveCategoryIds.mockResolvedValue({
        categoryIds: undefined,
        notFound: false,
      });
      repoMock.queryHybridRankedIds
        .mockResolvedValueOnce({ rows: [], total: 0, strategy: "hybrid_rrf" })
        .mockResolvedValueOnce({ rows: [], total: 0, strategy: "hybrid_rrf" })
        .mockResolvedValueOnce({
          rows: [{ id: 5, rrfScore: 0.016, denseScore: 0.65, ftsScore: 0 }],
          total: 1,
          strategy: "hybrid_rrf",
        });
      repoMock.computeFacets.mockResolvedValue({
        priceRange: { min: 220000, max: 450000 },
        availableColors: ["Trắng"],
        availableSizes: ["M"],
      });
      repoMock.findProductsByIdsWithRelations.mockResolvedValue([
        {
          id: 5,
          name: "Áo Sơ Mi",
          images: [],
          variants: [
            {
              id: 50,
              color: "Trắng",
              size: "M",
              listPrice: 240000,
              sellingPrice: 240000,
              stock: 2,
            },
          ],
        },
      ] as any);

      const res = await service.searchForAssistant({
        query: "áo sơ mi",
        filters: { colors: ["Đỏ"], maxPrice: 200000 },
        allowRelaxation: true,
      });

      expect(repoMock.queryHybridRankedIds).toHaveBeenCalledTimes(3);
      expect(res.meta.relaxedFilters).toEqual(["colors", "maxPrice"]);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe(5);
    });

    it("should run FEMALE/MALE/UNISEX branches and deduplicate when diversifyByGender is true", async () => {
      repoMock.resolveCategoryIds.mockResolvedValue({
        categoryIds: undefined,
        notFound: false,
      });
      repoMock.queryHybridRankedIds
        .mockResolvedValueOnce({
          rows: [
            { id: 1, rrfScore: 0.02, denseScore: 0.7, ftsScore: 0 },
            { id: 2, rrfScore: 0.019, denseScore: 0.68, ftsScore: 0 },
          ],
          total: 10,
          strategy: "hybrid_rrf",
        })
        .mockResolvedValueOnce({
          rows: [
            { id: 2, rrfScore: 0.02, denseScore: 0.66, ftsScore: 0 }, // duplicate across gender
            { id: 3, rrfScore: 0.018, denseScore: 0.64, ftsScore: 0 },
          ],
          total: 8,
          strategy: "hybrid_rrf",
        })
        .mockResolvedValueOnce({
          rows: [{ id: 4, rrfScore: 0.015, denseScore: 0.6, ftsScore: 0 }],
          total: 3,
          strategy: "hybrid_rrf",
        });
      repoMock.computeFacets.mockResolvedValue({
        priceRange: { min: 200000, max: 800000 },
        availableColors: ["Đen"],
        availableSizes: ["M"],
      });
      repoMock.findProductsByIdsWithRelations.mockResolvedValue([
        { id: 1, name: "P1", images: [], variants: [] },
        { id: 2, name: "P2", images: [], variants: [] },
        { id: 3, name: "P3", images: [], variants: [] },
        { id: 4, name: "P4", images: [], variants: [] },
      ] as any);

      const res = await service.searchForAssistant({
        query: "đi tiệc",
        diversifyByGender: true,
        genderLimits: { FEMALE: 2, MALE: 2, UNISEX: 1 },
      });

      expect(repoMock.queryHybridRankedIds).toHaveBeenCalledTimes(3);
      expect(res.items.map((i: any) => i.id)).toEqual([1, 2, 3, 4]);
      expect(res.meta.total).toBe(21);
    });
  });

  describe("findSemantic", () => {
    it("should return null when no matches and paginated object when paginated", async () => {
      repoMock.resolveCategoryIds.mockResolvedValue({
        categoryIds: undefined,
        notFound: false,
      });
      repoMock.queryHybridRankedIds.mockResolvedValueOnce({
        rows: [],
        total: 0,
        strategy: "hybrid_rrf",
      });

      const emptyRes = await service.findSemantic({ search: "không có" });
      expect(emptyRes).toBeNull();

      repoMock.queryHybridRankedIds.mockResolvedValueOnce({
        rows: [{ id: 1, rrfScore: 0.03, denseScore: 0.71, ftsScore: 0.2 }],
        total: 12,
        strategy: "hybrid_rrf",
      });
      repoMock.findProductsByIdsWithRelations.mockResolvedValue([
        { id: 1, name: "Áo Thun", images: [], variants: [] },
      ] as any);

      const pageRes = (await service.findSemantic({
        search: "áo thun",
        page: 1,
        limit: 5,
      })) as any;
      expect(pageRes.data[0].similarity).toBe(0.71);
      expect(pageRes.meta).toEqual({
        total: 12,
        page: 1,
        limit: 5,
        totalPages: 3,
      });
    });
  });
});

