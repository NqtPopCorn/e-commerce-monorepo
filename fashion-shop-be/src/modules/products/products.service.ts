import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GenderTarget } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PricingService } from "../pricing/pricing.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import {
  EmbeddingService,
  buildProductEmbeddingText,
} from "./embedding.service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async create(dto: CreateProductDto) {
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Danh mục với ID ${dto.categoryId} không tồn tại`,
        );
      }
      if (category.parentId === null) {
        throw new BadRequestException(
          "Chỉ có thể gán danh mục con (cấp 2) cho sản phẩm, không thể gán danh mục gốc.",
        );
      }
    }

    const { variants, images, slug, ...productData } = dto;
    const finalSlug = slug || `${slugify(productData.name)}-${Date.now()}`;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug: finalSlug,
        variants: variants
          ? {
              create: variants,
            }
          : undefined,
        images: images
          ? {
              create: images,
            }
          : undefined,
      },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    await this.syncProductEmbedding(product.id);
    return product;
  }

  async findAll(query?: {
    search?: string;
    mode?: string;
    categoryId?: number;
    category?: string;
    brandId?: number;
    targetGender?: GenderTarget;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      mode,
      categoryId,
      category,
      brandId,
      targetGender,
      minPrice,
      maxPrice,
      page,
      limit,
    } = query || {};

    if (mode === "semantic" && search?.trim()) {
      const semanticResult = await this.findSemantic({
        search: search.trim(),
        categoryId,
        category,
        brandId,
        targetGender,
        minPrice,
        maxPrice,
        page,
        limit,
      });
      if (semanticResult) {
        return semanticResult;
      }
    }

    let categoryFilter: any = undefined;
    if (categoryId) {
      const targetCategory = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });
      if (targetCategory && targetCategory.children.length > 0) {
        categoryFilter = {
          in: [targetCategory.id, ...targetCategory.children.map((c) => c.id)],
        };
      } else {
        categoryFilter = categoryId;
      }
    } else if (category) {
      const targetCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: category, mode: "insensitive" } },
            ...(isNaN(Number(category)) ? [] : [{ id: Number(category) }]),
          ],
        },
        include: { children: { select: { id: true } } },
      });
      if (targetCategory) {
        if (targetCategory.children.length > 0) {
          categoryFilter = {
            in: [
              targetCategory.id,
              ...targetCategory.children.map((c) => c.id),
            ],
          };
        } else {
          categoryFilter = targetCategory.id;
        }
      }
    }

    const where: any = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      ...(brandId ? { brandId } : {}),
      ...(targetGender ? { targetGender } : {}),
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          sellingPrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        },
      };
    }

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * take;

      const [total, data] = await Promise.all([
        this.prisma.product.count({ where }),
        this.prisma.product.findMany({
          where,
          include: {
            brand: true,
            category: {
              include: { parent: true },
            },
            variants: true,
            images: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
      ]);

      const enrichedData = await this.enrichProductsWithDiscountPrices(data);

      return {
        data: enrichedData,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take) || 1,
        },
      };
    }

    const data = await this.prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return this.enrichProductsWithDiscountPrices(data);
  }

  async getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalProducts, newThisWeek, allVariants] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.productVariant.findMany({
        select: { stock: true, sellingPrice: true, productId: true },
      }),
    ]);

    const totalStockValue = allVariants.reduce(
      (acc, v) => acc + (v.stock || 0) * Number(v.sellingPrice || 0),
      0,
    );

    const productStockMap = new Map<number, number>();
    for (const v of allVariants) {
      productStockMap.set(
        v.productId,
        (productStockMap.get(v.productId) || 0) + (v.stock || 0),
      );
    }

    let outOfStock = 0;
    for (const totalStock of productStockMap.values()) {
      if (totalStock <= 0) outOfStock++;
    }

    return {
      totalProducts,
      outOfStock,
      newThisWeek,
      totalStockValue,
    };
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

  private async enrichProductWithDiscountPrices(product: any) {
    if (!product || !product.variants || product.variants.length === 0) {
      return product;
    }
    const pricedVariants = await this.pricingService.calculateVariantsPrice(
      product.variants,
    );
    return {
      ...product,
      variants: pricedVariants,
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.enrichProductWithDiscountPrices(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.enrichProductWithDiscountPrices(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Danh mục với ID ${dto.categoryId} không tồn tại`,
        );
      }
      if (category.parentId === null) {
        throw new BadRequestException(
          "Chỉ có thể gán danh mục con (cấp 2) cho sản phẩm, không thể gán danh mục gốc.",
        );
      }
    }

    const { variants, images, ...productData } = dto;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (variants) {
        // Lấy danh sách biến thể hiện tại của sản phẩm trong database
        const currentVariants = await tx.productVariant.findMany({
          where: { productId: id },
        });

        // Xác định các biến thể bị gỡ bỏ (tồn tại trong DB nhưng không có trong danh sách cập nhật)
        const incomingSkus = new Set(variants.map((v) => v.sku));
        const variantsToDelete = currentVariants.filter(
          (cv) => !incomingSkus.has(cv.sku),
        );

        // Kiểm tra logic: không thể xóa biến thể còn tồn kho (> 0)
        for (const v of variantsToDelete) {
          if (v.stock > 0) {
            throw new BadRequestException(
              `Không thể xóa biến thể có mã SKU '${v.sku}' vì vẫn còn tồn kho (${v.stock} sản phẩm).`,
            );
          }
        }

        // Xóa các biến thể đã bị gỡ bỏ và có tồn kho <= 0
        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete.map((v) => v.id) },
            },
          });
        }

        // Cập nhật hoặc tạo mới các biến thể
        for (const v of variants) {
          const existingVariant = currentVariants.find(
            (cv) => cv.sku === v.sku,
          );
          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                barcode: v.barcode,
                size: v.size,
                color: v.color,
                colorHex: v.colorHex,
                imageUrl: v.imageUrl,
                listPrice: v.listPrice,
                sellingPrice: v.sellingPrice,
                stock: v.stock !== undefined ? v.stock : existingVariant.stock,
                weight: v.weight,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                ...v,
                productId: id,
              },
            });
          }
        }
      }

      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(images
            ? {
                images: {
                  create: images,
                },
              }
            : {}),
        },
        include: {
          brand: true,
          category: {
            include: { parent: true },
          },
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    await this.syncProductEmbedding(id);
    return updated;
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    const variantsWithStock =
      product.variants?.filter((v: any) => v.stock > 0) || [];
    if (variantsWithStock.length > 0) {
      const totalStock = variantsWithStock.reduce(
        (acc: number, v: any) => acc + (v.stock || 0),
        0,
      );
      throw new BadRequestException(
        `Không thể xóa sản phẩm khi vẫn còn tồn kho (${totalStock} sản phẩm thuộc ${variantsWithStock.length} biến thể).`,
      );
    }
    return this.prisma.product.delete({ where: { id } });
  }

  async syncProductEmbedding(id: number): Promise<void> {
    try {
      const fullProduct = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: { include: { parent: true } },
          brand: true,
          variants: true,
        },
      });
      if (!fullProduct) return;
      const text = buildProductEmbeddingText(fullProduct);
      const vector = await this.embeddingService.generateEmbedding(text);
      if (vector && vector.length === 768) {
        const vectorString = `[${vector.join(",")}]`;
        await this.prisma.$executeRawUnsafe(
          `UPDATE products SET embedding = $1::vector, embedding_text = $2, updated_at = NOW() WHERE id = $3`,
          vectorString,
          text,
          id,
        );
      }
    } catch (err: any) {
      console.warn(
        `[ProductsService] syncProductEmbedding failed for #${id}:`,
        err?.message || err,
      );
    }
  }

  private async findSemantic(query: {
    search: string;
    categoryId?: number;
    category?: string;
    brandId?: number;
    targetGender?: GenderTarget;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      categoryId,
      category,
      brandId,
      targetGender,
      minPrice,
      maxPrice,
      page,
      limit,
    } = query;

    const vector = await this.embeddingService.generateEmbedding(search);
    if (!vector || vector.length !== 768) {
      return null;
    }

    let categoryIds: number[] | undefined = undefined;
    if (categoryId) {
      const targetCategory = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });
      if (targetCategory && targetCategory.children.length > 0) {
        categoryIds = [
          targetCategory.id,
          ...targetCategory.children.map((c) => c.id),
        ];
      } else if (targetCategory) {
        categoryIds = [targetCategory.id];
      }
    } else if (category) {
      const targetCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: category, mode: "insensitive" } },
            ...(isNaN(Number(category)) ? [] : [{ id: Number(category) }]),
          ],
        },
        include: { children: { select: { id: true } } },
      });
      if (targetCategory && targetCategory.children.length > 0) {
        categoryIds = [
          targetCategory.id,
          ...targetCategory.children.map((c) => c.id),
        ];
      } else if (targetCategory) {
        categoryIds = [targetCategory.id];
      }
    }

    const conditions: string[] = ["p.embedding IS NOT NULL"];
    const params: any[] = [`[${vector.join(",")}]`];
    let paramIndex = 2;

    // Minimum similarity threshold (0.45 cosine similarity)
    conditions.push(`(1 - (p.embedding <=> $1::vector)) >= 0.45`);

    if (categoryIds && categoryIds.length > 0) {
      conditions.push(`p.category_id = ANY($${paramIndex++}::int[])`);
      params.push(categoryIds);
    }
    if (brandId) {
      conditions.push(`p.brand_id = $${paramIndex++}`);
      params.push(brandId);
    }
    if (targetGender) {
      conditions.push(`p.target_gender = $${paramIndex++}::"GenderTarget"`);
      params.push(targetGender);
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      conditions.push(`EXISTS (
        SELECT 1 FROM product_variants pv 
        WHERE pv.product_id = p.id 
          ${minPrice !== undefined ? `AND pv.selling_price >= ${Number(minPrice)}` : ""}
          ${maxPrice !== undefined ? `AND pv.selling_price <= ${Number(maxPrice)}` : ""}
      )`);
    }

    const whereClause = conditions.join(" AND ");

    // Count total matches
    const countSql = `SELECT count(*)::int AS count FROM products p WHERE ${whereClause}`;
    const countResult = (await this.prisma.$queryRawUnsafe(
      countSql,
      ...params,
    )) as Array<{ count: number }>;
    const total = countResult[0]?.count || 0;

    if (total === 0) {
      return null;
    }

    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * take;

    const selectSql = `
      SELECT p.id, round((1 - (p.embedding <=> $1::vector))::numeric, 4)::float AS similarity
      FROM products p
      WHERE ${whereClause}
      ORDER BY p.embedding <=> $1::vector ASC
      ${isPaginated ? `LIMIT ${take} OFFSET ${skip}` : ""}
    `;

    const matchedRows = (await this.prisma.$queryRawUnsafe(
      selectSql,
      ...params,
    )) as Array<{ id: number; similarity: number }>;

    if (!matchedRows || matchedRows.length === 0) {
      return null;
    }

    const matchedIds = matchedRows.map((r) => r.id);
    const similarityMap = new Map<number, number>(
      matchedRows.map((r) => [r.id, r.similarity]),
    );

    const products = await this.prisma.product.findMany({
      where: { id: { in: matchedIds } },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    const sortedProducts = products
      .map((p) => ({
        ...p,
        similarity: similarityMap.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const enrichedData =
      await this.enrichProductsWithDiscountPrices(sortedProducts);

    if (isPaginated) {
      return {
        data: enrichedData,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take) || 1,
        },
      };
    }

    return enrichedData;
  }
}

