import { Injectable, Logger, Optional } from "@nestjs/common";
import { GenderTarget } from "@prisma/client";
import { PricingService } from "../pricing/pricing.service";
import { ProductSearchSort, SearchProductsDto } from "./dto/search-products.dto";
import {
  EmbeddingService,
  buildProductEmbeddingText,
  buildProductSearchText,
} from "./embedding.service";
import {
  HybridWhereOptions,
  ProductSearchRepository,
  RankedProductRow,
  SearchStrategy,
} from "./product-search.repository";

export interface SemanticFindQuery {
  search: string;
  categoryId?: number;
  category?: string;
  brandId?: number;
  targetGender?: GenderTarget;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(
    private readonly repository: ProductSearchRepository,
    private readonly pricingService: PricingService,
    @Optional() private readonly embeddingService?: EmbeddingService,
  ) {}

  async syncProductEmbedding(id: number): Promise<void> {
    try {
      const fullProduct = await this.repository.findProductForEmbedding(id);
      if (!fullProduct) return;

      const embeddingText = buildProductEmbeddingText(fullProduct);
      const searchText = buildProductSearchText(fullProduct);
      const expectedDim = this.embeddingService?.getEmbeddingDim() ?? 1024;
      const embeddingModel =
        this.embeddingService?.getEmbeddingModel() ?? "bge-m3";

      const vector = await this.embeddingService?.generateEmbedding(embeddingText);
      const validVector =
        vector && vector.length === expectedDim ? vector : null;

      await this.repository.updateProductSearchVectors({
        id,
        embeddingText,
        searchText,
        vector: validVector,
        embeddingModel,
      });
    } catch (err: any) {
      this.logger.warn(
        `syncProductEmbedding failed for #${id}: ${err?.message || err}`,
      );
    }
  }

  private async executeSearch(
    options: HybridWhereOptions & {
      query?: string;
      sort?: ProductSearchSort;
      page?: number;
      limit?: number;
      paginate?: boolean;
      precomputedVector?: number[] | null;
    },
  ): Promise<{
    rows: RankedProductRow[];
    total: number;
    strategy: SearchStrategy;
  }> {
    const trimmedQuery = (options.query || "").trim();
    const expectedDim = this.embeddingService?.getEmbeddingDim() ?? 1024;
    const embeddingModel =
      this.embeddingService?.getEmbeddingModel() ?? "bge-m3";
    const minSimilarity = this.embeddingService?.getMinSimilarity() ?? 0.35;

    let queryVector: number[] | null = null;
    if (trimmedQuery) {
      const rawVector =
        options.precomputedVector !== undefined
          ? options.precomputedVector
          : ((await this.embeddingService?.generateEmbedding(trimmedQuery)) ??
            null);
      if (Array.isArray(rawVector) && rawVector.length === expectedDim) {
        queryVector = rawVector;
      }
    }

    return this.repository.queryHybridRankedIds({
      ...options,
      query: trimmedQuery,
      queryVector,
      embeddingModel,
      minSimilarity,
    });
  }

  private async enrichProductsWithDiscountPrices(products: any[]) {
    if (!products || products.length === 0) return products;
    const allVariants = products.flatMap((p) => p.variants || []);
    if (allVariants.length === 0) return products;

    const pricedVariants =
      await this.pricingService.calculateVariantsPrice(allVariants);
    const pricedVariantMap = new Map(pricedVariants.map((v) => [v.id, v]));

    return products.map((product) => ({
      ...product,
      variants: product.variants?.map(
        (v: any) => pricedVariantMap.get(v.id) || v,
      ),
    }));
  }

  private async hydrateProductsByRankedRows(
    rows: RankedProductRow[],
    options?: { inStockOnly?: boolean; includeAssistantMeta?: boolean },
  ) {
    if (rows.length === 0) return [];

    const matchedIds = rows.map((r) => r.id);
    const scoreMap = new Map(rows.map((r) => [r.id, r]));

    const products =
      await this.repository.findProductsByIdsWithRelations(matchedIds);
    const productById = new Map(products.map((p) => [p.id, p]));
    const orderedProducts = matchedIds
      .map((id) => productById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const enrichedData =
      await this.enrichProductsWithDiscountPrices(orderedProducts);

    return enrichedData.map((p: any) => {
      const scoreInfo = scoreMap.get(p.id);
      const similarityRaw =
        scoreInfo && scoreInfo.denseScore > 0
          ? scoreInfo.denseScore
          : (scoreInfo?.rrfScore ?? 0);
      const similarity = Number(similarityRaw.toFixed(4));

      if (!options?.includeAssistantMeta) {
        return {
          ...p,
          similarity,
        };
      }

      const activeVariants = (p.variants || []).filter((v: any) =>
        options.inStockOnly ? (v.stock || 0) > 0 : true,
      );
      const availableColors = Array.from(
        new Set(activeVariants.map((v: any) => v.color).filter(Boolean)),
      );
      const availableSizes = Array.from(
        new Set(activeVariants.map((v: any) => v.size).filter(Boolean)),
      );

      const finalPrices = (p.variants || [])
        .map((v: any) => Number(v.finalPrice ?? v.sellingPrice ?? 0))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      const listPrices = (p.variants || [])
        .map((v: any) => Number(v.listPrice ?? v.sellingPrice ?? 0))
        .filter((n: number) => Number.isFinite(n) && n > 0);

      const minFinal = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
      const maxList =
        listPrices.length > 0 ? Math.max(...listPrices) : minFinal;
      const discountPercent =
        maxList > minFinal
          ? Math.round(((maxList - minFinal) / maxList) * 100)
          : null;

      return {
        ...p,
        similarity,
        scores: {
          rrf: Number((scoreInfo?.rrfScore ?? 0).toFixed(4)),
          dense: Number((scoreInfo?.denseScore ?? 0).toFixed(4)),
          fts: Number((scoreInfo?.ftsScore ?? 0).toFixed(4)),
        },
        availableColors,
        availableSizes,
        thumbnailUrl:
          p.images?.[0]?.url || p.variants?.[0]?.imageUrl || null,
        priceRange: {
          minFinal,
          maxList,
          discountPercent,
        },
      };
    });
  }

  async searchForAssistant(dto: SearchProductsDto) {
    const filters = dto.filters || {};
    const inStockOnly = filters.inStockOnly ?? true;
    const allowRelaxation = dto.allowRelaxation ?? true;
    const limit = Math.max(1, Math.min(50, dto.limit ?? 5));
    const page = Math.max(1, dto.page ?? 1);
    const sort: ProductSearchSort = dto.sort || "relevance";
    const trimmedQuery = (dto.query || "").trim();

    const { categoryIds, notFound } = await this.repository.resolveCategoryIds({
      categoryId: filters.categoryId,
      categories: filters.categories,
    });

    if (notFound) {
      const facets = await this.repository.computeFacets({
        brandId: filters.brandId,
        targetGender: filters.targetGender,
        excludeProductIds: dto.excludeProductIds,
        inStockOnly,
      });
      return {
        items: [],
        meta: {
          total: 0,
          strategy: "hybrid_rrf",
          relaxedFilters: [],
          facets,
        },
      };
    }

    const baseVector = trimmedQuery
      ? ((await this.embeddingService?.generateEmbedding(trimmedQuery)) ?? null)
      : null;

    if (dto.diversifyByGender && !filters.targetGender) {
      const genders: GenderTarget[] = [
        GenderTarget.FEMALE,
        GenderTarget.MALE,
        GenderTarget.UNISEX,
      ];
      const defaultLimits: Record<string, number> = {
        FEMALE: 2,
        MALE: 2,
        UNISEX: 1,
      };

      const branchQueries = genders.map((g) =>
        (dto.genderQueries?.[g] || trimmedQuery).trim(),
      );
      const branchVectors = await Promise.all(
        branchQueries.map((bq) => {
          if (!bq) return Promise.resolve(null);
          if (bq === trimmedQuery) return Promise.resolve(baseVector);
          return (
            this.embeddingService?.generateEmbedding(bq) ??
            Promise.resolve(null)
          );
        }),
      );

      const branchResults = await Promise.all(
        genders.map((g, idx) => {
          const gLimit = Math.max(
            1,
            Math.min(
              10,
              Number(dto.genderLimits?.[g] ?? defaultLimits[g]) || 1,
            ),
          );
          return this.executeSearch({
            query: branchQueries[idx],
            categoryIds,
            brandId: filters.brandId,
            targetGender: g,
            excludeProductIds: dto.excludeProductIds,
            fit: filters.fit,
            pattern: filters.pattern,
            occasion: filters.occasion,
            colors: filters.colors,
            sizes: filters.sizes,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            inStockOnly,
            sort,
            page: 1,
            limit: gLimit + 2,
            paginate: true,
            precomputedVector: branchVectors[idx],
          });
        }),
      );

      const seen = new Set<number>();
      const mergedRows: RankedProductRow[] = [];
      let totalMatched = 0;

      for (let i = 0; i < genders.length; i++) {
        const g = genders[i];
        const gLimit = Math.max(
          1,
          Math.min(10, Number(dto.genderLimits?.[g] ?? defaultLimits[g]) || 1),
        );
        const res = branchResults[i];
        totalMatched += res.total;
        let picked = 0;
        for (const row of res.rows) {
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          mergedRows.push(row);
          picked++;
          if (picked >= gLimit) break;
        }
      }

      const strategy = branchResults.some((r) => r.strategy === "hybrid_rrf")
        ? "hybrid_rrf"
        : branchResults[0]?.strategy || "hybrid_rrf";

      const [items, facets] = await Promise.all([
        this.hydrateProductsByRankedRows(mergedRows, {
          inStockOnly,
          includeAssistantMeta: true,
        }),
        this.repository.computeFacets({
          categoryIds,
          brandId: filters.brandId,
          excludeProductIds: dto.excludeProductIds,
          inStockOnly,
        }),
      ]);

      return {
        items,
        meta: {
          total: totalMatched,
          strategy,
          relaxedFilters: [],
          facets,
        },
      };
    }

    let searchRes = await this.executeSearch({
      query: trimmedQuery,
      categoryIds,
      brandId: filters.brandId,
      targetGender: filters.targetGender,
      excludeProductIds: dto.excludeProductIds,
      fit: filters.fit,
      pattern: filters.pattern,
      occasion: filters.occasion,
      colors: filters.colors,
      sizes: filters.sizes,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStockOnly,
      sort,
      page,
      limit,
      paginate: true,
      precomputedVector: baseVector,
    });

    const relaxedFilters: string[] = [];

    if (searchRes.rows.length === 0 && allowRelaxation) {
      let curColors = filters.colors;
      let curSizes = filters.sizes;
      let curMinPrice = filters.minPrice;
      let curMaxPrice = filters.maxPrice;
      let curFit = filters.fit;
      let curPattern = filters.pattern;
      let curOccasion = filters.occasion;

      // Step 1: Relax variant color/size constraints
      if (
        (curSizes && curSizes.length > 0) ||
        (curColors && curColors.length > 0)
      ) {
        if (curSizes && curSizes.length > 0) relaxedFilters.push("sizes");
        if (curColors && curColors.length > 0) relaxedFilters.push("colors");
        curSizes = undefined;
        curColors = undefined;

        searchRes = await this.executeSearch({
          query: trimmedQuery,
          categoryIds,
          brandId: filters.brandId,
          targetGender: filters.targetGender,
          excludeProductIds: dto.excludeProductIds,
          fit: curFit,
          pattern: curPattern,
          occasion: curOccasion,
          minPrice: curMinPrice,
          maxPrice: curMaxPrice,
          inStockOnly,
          sort,
          page: 1,
          limit,
          paginate: true,
          precomputedVector: baseVector,
        });
      }

      // Step 2: Relax maxPrice by +25%, then drop full price bounds if still 0
      if (
        searchRes.rows.length === 0 &&
        (curMaxPrice !== undefined || curMinPrice !== undefined)
      ) {
        if (curMaxPrice !== undefined) {
          relaxedFilters.push("maxPrice");
          searchRes = await this.executeSearch({
            query: trimmedQuery,
            categoryIds,
            brandId: filters.brandId,
            targetGender: filters.targetGender,
            excludeProductIds: dto.excludeProductIds,
            fit: curFit,
            pattern: curPattern,
            occasion: curOccasion,
            minPrice: curMinPrice,
            maxPrice: Math.round(curMaxPrice * 1.25),
            inStockOnly,
            sort,
            page: 1,
            limit,
            paginate: true,
            precomputedVector: baseVector,
          });
        }
        if (searchRes.rows.length === 0) {
          if (curMinPrice !== undefined) relaxedFilters.push("minPrice");
          curMinPrice = undefined;
          curMaxPrice = undefined;
          searchRes = await this.executeSearch({
            query: trimmedQuery,
            categoryIds,
            brandId: filters.brandId,
            targetGender: filters.targetGender,
            excludeProductIds: dto.excludeProductIds,
            fit: curFit,
            pattern: curPattern,
            occasion: curOccasion,
            inStockOnly,
            sort,
            page: 1,
            limit,
            paginate: true,
            precomputedVector: baseVector,
          });
        }
      }

      // Step 3: Relax style attributes (fit, pattern, occasion)
      if (
        searchRes.rows.length === 0 &&
        (curFit || curPattern || curOccasion)
      ) {
        if (curFit) relaxedFilters.push("fit");
        if (curPattern) relaxedFilters.push("pattern");
        if (curOccasion) relaxedFilters.push("occasion");
        curFit = undefined;
        curPattern = undefined;
        curOccasion = undefined;

        searchRes = await this.executeSearch({
          query: trimmedQuery,
          categoryIds,
          brandId: filters.brandId,
          targetGender: filters.targetGender,
          excludeProductIds: dto.excludeProductIds,
          inStockOnly,
          sort,
          page: 1,
          limit,
          paginate: true,
          precomputedVector: baseVector,
        });
      }
    }

    const [items, facets] = await Promise.all([
      this.hydrateProductsByRankedRows(searchRes.rows, {
        inStockOnly,
        includeAssistantMeta: true,
      }),
      this.repository.computeFacets({
        categoryIds,
        brandId: filters.brandId,
        targetGender: filters.targetGender,
        excludeProductIds: dto.excludeProductIds,
        inStockOnly,
      }),
    ]);

    return {
      items,
      meta: {
        total: searchRes.total,
        strategy: searchRes.strategy,
        relaxedFilters: Array.from(new Set(relaxedFilters)),
        facets,
      },
    };
  }

  async findSemantic(query: SemanticFindQuery) {
    const {
      search,
      categoryId,
      category,
      brandId,
      targetGender,
      minPrice,
      maxPrice,
      inStock,
      page,
      limit,
    } = query;

    const { categoryIds } = await this.repository.resolveCategoryIds({
      categoryId,
      categories: category ? [category] : undefined,
    });

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 10);

    const searchRes = await this.executeSearch({
      query: search,
      categoryIds,
      brandId,
      targetGender,
      minPrice,
      maxPrice,
      inStockOnly: Boolean(inStock),
      sort: "relevance",
      page: pageNum,
      limit: take,
      paginate: isPaginated,
    });

    if (searchRes.rows.length === 0) {
      return null;
    }

    const enrichedData = await this.hydrateProductsByRankedRows(searchRes.rows, {
      inStockOnly: Boolean(inStock),
      includeAssistantMeta: false,
    });

    if (isPaginated) {
      return {
        data: enrichedData,
        meta: {
          total: searchRes.total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(searchRes.total / take) || 1,
        },
      };
    }

    return enrichedData;
  }
}

