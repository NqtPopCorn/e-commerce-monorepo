import { Injectable } from "@nestjs/common";
import { GenderTarget } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductSearchSort } from "./dto/search-products.dto";

export type SearchStrategy = "hybrid_rrf" | "fts_only" | "filter_only";

export interface RankedProductRow {
  id: number;
  rrfScore: number;
  denseScore: number;
  ftsScore: number;
}

export interface SearchFacets {
  priceRange: { min: number | null; max: number | null };
  availableColors: string[];
  availableSizes: string[];
}

export interface HybridWhereOptions {
  categoryIds?: number[];
  brandId?: number;
  targetGender?: GenderTarget;
  excludeProductIds?: number[];
  fit?: string;
  pattern?: string;
  occasion?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export interface HybridQueryOptions extends HybridWhereOptions {
  query?: string;
  queryVector?: number[] | null;
  embeddingModel: string;
  minSimilarity: number;
  sort?: ProductSearchSort;
  page?: number;
  limit?: number;
  paginate?: boolean;
}

export interface FacetsQueryOptions {
  categoryIds?: number[];
  brandId?: number;
  targetGender?: GenderTarget;
  excludeProductIds?: number[];
  inStockOnly: boolean;
}

@Injectable()
export class ProductSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProductForEmbedding(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { include: { parent: true } },
        brand: true,
        variants: true,
      },
    });
  }

  async updateProductSearchVectors(params: {
    id: number;
    embeddingText: string;
    searchText: string;
    vector?: number[] | null;
    embeddingModel?: string;
  }): Promise<void> {
    const { id, embeddingText, searchText, vector, embeddingModel } = params;

    if (vector && vector.length > 0 && embeddingModel) {
      const vectorString = `[${vector.join(",")}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE products
         SET embedding = $1::vector,
             embedding_text = $2,
             embedding_model = $3,
             search_vector = to_tsvector('simple', unaccent($4)),
             updated_at = NOW()
         WHERE id = $5`,
        vectorString,
        embeddingText,
        embeddingModel,
        searchText,
        id,
      );
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE products
       SET embedding_text = $1,
           search_vector = to_tsvector('simple', unaccent($2)),
           updated_at = NOW()
       WHERE id = $3`,
      embeddingText,
      searchText,
      id,
    );
  }

  async resolveCategoryIds(options: {
    categoryId?: number;
    categories?: string[];
  }): Promise<{ categoryIds?: number[]; notFound: boolean }> {
    const { categoryId, categories } = options;

    if (categoryId) {
      const targetCategory = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });
      if (!targetCategory) {
        return { categoryIds: undefined, notFound: true };
      }
      const ids =
        targetCategory.children.length > 0
          ? [targetCategory.id, ...targetCategory.children.map((c) => c.id)]
          : [targetCategory.id];
      return { categoryIds: ids, notFound: false };
    }

    const cleanedNames = (categories || [])
      .map((c) => c.trim())
      .filter(Boolean);
    if (cleanedNames.length === 0) {
      return { categoryIds: undefined, notFound: false };
    }

    const collected = new Set<number>();
    for (const catName of cleanedNames) {
      const targetCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: catName, mode: "insensitive" } },
            ...(isNaN(Number(catName)) ? [] : [{ id: Number(catName) }]),
          ],
        },
        include: { children: { select: { id: true } } },
      });
      if (targetCategory) {
        collected.add(targetCategory.id);
        for (const child of targetCategory.children) {
          collected.add(child.id);
        }
      }
    }

    if (collected.size === 0) {
      return { categoryIds: undefined, notFound: true };
    }
    return { categoryIds: Array.from(collected), notFound: false };
  }

  private buildHybridWhereClause(options: HybridWhereOptions): {
    whereClause: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    const addParam = (val: unknown): string => {
      params.push(val);
      return `$${params.length}`;
    };

    if (options.categoryIds && options.categoryIds.length > 0) {
      conditions.push(
        `p.category_id = ANY(${addParam(options.categoryIds)}::int[])`,
      );
    }
    if (options.brandId) {
      conditions.push(`p.brand_id = ${addParam(options.brandId)}::int`);
    }
    if (options.targetGender) {
      conditions.push(
        `p.target_gender = ${addParam(options.targetGender)}::"GenderTarget"`,
      );
    }
    if (options.excludeProductIds && options.excludeProductIds.length > 0) {
      conditions.push(
        `NOT (p.id = ANY(${addParam(options.excludeProductIds)}::int[]))`,
      );
    }
    if (options.fit?.trim()) {
      conditions.push(
        `p.fit IS NOT NULL AND unaccent(lower(p.fit)) LIKE '%' || unaccent(lower(${addParam(options.fit.trim())})) || '%'`,
      );
    }
    if (options.pattern?.trim()) {
      conditions.push(
        `p.pattern IS NOT NULL AND unaccent(lower(p.pattern)) LIKE '%' || unaccent(lower(${addParam(options.pattern.trim())})) || '%'`,
      );
    }
    if (options.occasion?.trim()) {
      conditions.push(
        `p.occasion IS NOT NULL AND unaccent(lower(p.occasion)) LIKE '%' || unaccent(lower(${addParam(options.occasion.trim())})) || '%'`,
      );
    }

    const variantConds: string[] = ["pv.product_id = p.id"];
    if (options.inStockOnly) {
      variantConds.push("pv.stock > 0");
    }
    if (options.minPrice !== undefined) {
      variantConds.push(
        `pv.selling_price >= ${addParam(Number(options.minPrice))}::numeric`,
      );
    }
    if (options.maxPrice !== undefined) {
      variantConds.push(
        `pv.selling_price <= ${addParam(Number(options.maxPrice))}::numeric`,
      );
    }

    const cleanedColors = (options.colors || [])
      .map((c) => c.trim())
      .filter(Boolean);
    if (cleanedColors.length > 0) {
      const colorOrs = cleanedColors.map(
        (c) =>
          `unaccent(lower(coalesce(pv.color, ''))) LIKE '%' || unaccent(lower(${addParam(c)})) || '%'`,
      );
      variantConds.push(`(${colorOrs.join(" OR ")})`);
    }

    const cleanedSizes = (options.sizes || [])
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (cleanedSizes.length > 0) {
      variantConds.push(
        `upper(coalesce(pv.size, '')) = ANY(${addParam(cleanedSizes)}::text[])`,
      );
    }

    if (variantConds.length > 1) {
      conditions.push(
        `EXISTS (SELECT 1 FROM product_variants pv WHERE ${variantConds.join(" AND ")})`,
      );
    }

    return {
      whereClause: conditions.length > 0 ? conditions.join(" AND ") : "TRUE",
      params,
    };
  }

  async queryHybridRankedIds(options: HybridQueryOptions): Promise<{
    rows: RankedProductRow[];
    total: number;
    strategy: SearchStrategy;
  }> {
    const trimmedQuery = (options.query || "").trim();
    const sort: ProductSearchSort = options.sort || "relevance";
    const pageNum = Math.max(1, Number(options.page) || 1);
    const take = Math.max(1, Math.min(50, Number(options.limit) || 10));
    const skip = (pageNum - 1) * take;
    const paginate = options.paginate !== false;

    const { whereClause, params } = this.buildHybridWhereClause(options);
    const addParam = (val: unknown): string => {
      params.push(val);
      return `$${params.length}`;
    };

    const priceJoin =
      sort === "price_asc" || sort === "price_desc"
        ? `LEFT JOIN (
             SELECT product_id, MIN(selling_price) AS min_price
             FROM product_variants
             ${options.inStockOnly ? "WHERE stock > 0" : ""}
             GROUP BY product_id
           ) vp ON vp.product_id = p.id`
        : "";

    if (!trimmedQuery) {
      let orderBy = "p.rating_average DESC, p.created_at DESC, p.id DESC";
      if (sort === "price_asc") {
        orderBy = "vp.min_price ASC NULLS LAST, p.id ASC";
      } else if (sort === "price_desc") {
        orderBy = "vp.min_price DESC NULLS LAST, p.id DESC";
      } else if (sort === "rating_desc") {
        orderBy = "p.rating_average DESC, p.review_count DESC, p.id DESC";
      }

      const sql = `
        SELECT
          p.id,
          0.0::float AS rrf_score,
          0.0::float AS dense_score,
          0.0::float AS fts_score,
          COUNT(*) OVER()::int AS total_count
        FROM products p
        ${priceJoin}
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        ${paginate ? `LIMIT ${take} OFFSET ${skip}` : ""}
      `;
      const matched = (await this.prisma.$queryRawUnsafe(
        sql,
        ...params,
      )) as Array<{
        id: number;
        rrf_score: number;
        dense_score: number;
        fts_score: number;
        total_count: number;
      }>;

      return {
        rows: matched.map((r) => ({
          id: r.id,
          rrfScore: 0,
          denseScore: 0,
          ftsScore: 0,
        })),
        total: matched[0]?.total_count ?? 0,
        strategy: "filter_only",
      };
    }

    const vector = options.queryVector;
    const hasValidVector = Array.isArray(vector) && vector.length > 0;

    const queryParam = addParam(trimmedQuery);
    let denseCte = "";
    let fusedCte = "";

    if (hasValidVector) {
      const vecParam = addParam(`[${vector!.join(",")}]`);
      const modelParam = addParam(options.embeddingModel);
      const minSimParam = addParam(options.minSimilarity);

      denseCte = `
        dense AS (
          SELECT
            p.id,
            (1 - (p.embedding <=> ${vecParam}::vector))::float AS dense_score,
            ROW_NUMBER() OVER (ORDER BY p.embedding <=> ${vecParam}::vector ASC) AS dense_rank
          FROM products p
          WHERE ${whereClause}
            AND p.embedding IS NOT NULL
            AND (p.embedding_model IS NULL OR p.embedding_model = ${modelParam})
            AND (1 - (p.embedding <=> ${vecParam}::vector)) >= ${minSimParam}
          ORDER BY p.embedding <=> ${vecParam}::vector ASC
          LIMIT 100
        ),
      `;

      fusedCte = `
        fused AS (
          SELECT
            COALESCE(d.id, f.id) AS id,
            (COALESCE(1.0 / (60.0 + d.dense_rank), 0.0) + COALESCE(1.0 / (60.0 + f.fts_rank), 0.0))::float AS rrf_score,
            COALESCE(d.dense_score, 0.0)::float AS dense_score,
            COALESCE(f.fts_score, 0.0)::float AS fts_score
          FROM dense d
          FULL OUTER JOIN fts f ON d.id = f.id
        )
      `;
    } else {
      fusedCte = `
        fused AS (
          SELECT
            f.id,
            (1.0 / (60.0 + f.fts_rank))::float AS rrf_score,
            0.0::float AS dense_score,
            f.fts_score::float AS fts_score
          FROM fts f
        )
      `;
    }

    let orderBy =
      "fu.rrf_score DESC, fu.dense_score DESC, fu.fts_score DESC, fu.id ASC";
    if (sort === "price_asc") {
      orderBy = "vp.min_price ASC NULLS LAST, fu.rrf_score DESC";
    } else if (sort === "price_desc") {
      orderBy = "vp.min_price DESC NULLS LAST, fu.rrf_score DESC";
    } else if (sort === "rating_desc") {
      orderBy = "p.rating_average DESC, p.review_count DESC, fu.rrf_score DESC";
    }

    const sql = `
      WITH
      ${denseCte}
      fts AS (
        SELECT
          p.id,
          ts_rank_cd(p.search_vector, plainto_tsquery('simple', unaccent(${queryParam})))::float AS fts_score,
          ROW_NUMBER() OVER (
            ORDER BY ts_rank_cd(p.search_vector, plainto_tsquery('simple', unaccent(${queryParam}))) DESC, p.id ASC
          ) AS fts_rank
        FROM products p
        WHERE ${whereClause}
          AND p.search_vector IS NOT NULL
          AND p.search_vector @@ plainto_tsquery('simple', unaccent(${queryParam}))
        ORDER BY fts_score DESC, p.id ASC
        LIMIT 100
      ),
      ${fusedCte}
      SELECT
        fu.id,
        fu.rrf_score,
        fu.dense_score,
        fu.fts_score,
        COUNT(*) OVER()::int AS total_count
      FROM fused fu
      JOIN products p ON p.id = fu.id
      ${priceJoin}
      ORDER BY ${orderBy}
      ${paginate ? `LIMIT ${take} OFFSET ${skip}` : ""}
    `;

    const matched = (await this.prisma.$queryRawUnsafe(
      sql,
      ...params,
    )) as Array<{
      id: number;
      rrf_score: number;
      dense_score: number;
      fts_score: number;
      total_count: number;
    }>;

    return {
      rows: matched.map((r) => ({
        id: r.id,
        rrfScore: Number(r.rrf_score) || 0,
        denseScore: Number(r.dense_score) || 0,
        ftsScore: Number(r.fts_score) || 0,
      })),
      total: matched[0]?.total_count ?? 0,
      strategy: hasValidVector ? "hybrid_rrf" : "fts_only",
    };
  }

  async computeFacets(options: FacetsQueryOptions): Promise<SearchFacets> {
    const { whereClause, params } = this.buildHybridWhereClause({
      categoryIds: options.categoryIds,
      brandId: options.brandId,
      targetGender: options.targetGender,
      excludeProductIds: options.excludeProductIds,
      inStockOnly: options.inStockOnly,
    });
    const stockFilter = options.inStockOnly ? "AND pv.stock > 0" : "";

    const [priceRows, colorRows, sizeRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<
        Array<{ min_price: number | null; max_price: number | null }>
      >(
        `SELECT MIN(pv.selling_price)::float AS min_price, MAX(pv.selling_price)::float AS max_price
         FROM products p
         JOIN product_variants pv ON pv.product_id = p.id
         WHERE ${whereClause} ${stockFilter}`,
        ...params,
      ),
      this.prisma.$queryRawUnsafe<Array<{ color: string; cnt: number }>>(
        `SELECT pv.color, COUNT(DISTINCT p.id)::int AS cnt
         FROM products p
         JOIN product_variants pv ON pv.product_id = p.id
         WHERE ${whereClause} ${stockFilter}
           AND pv.color IS NOT NULL AND pv.color <> ''
         GROUP BY pv.color
         ORDER BY cnt DESC, pv.color ASC
         LIMIT 15`,
        ...params,
      ),
      this.prisma.$queryRawUnsafe<Array<{ size: string }>>(
        `SELECT DISTINCT pv.size
         FROM products p
         JOIN product_variants pv ON pv.product_id = p.id
         WHERE ${whereClause} ${stockFilter}
           AND pv.size IS NOT NULL AND pv.size <> ''`,
        ...params,
      ),
    ]);

    const sizeOrder = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "2XL",
      "3XL",
      "FREESIZE",
    ];
    const sortedSizes = sizeRows
      .map((r) => r.size)
      .sort((a, b) => {
        const ia = sizeOrder.indexOf(a.toUpperCase());
        const ib = sizeOrder.indexOf(b.toUpperCase());
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b, "vi");
      });

    return {
      priceRange: {
        min: priceRows[0]?.min_price ?? null,
        max: priceRows[0]?.max_price ?? null,
      },
      availableColors: colorRows.map((r) => r.color),
      availableSizes: sortedSizes,
    };
  }

  async findProductsByIdsWithRelations(ids: number[]) {
    if (ids.length === 0) return [];
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }
}

