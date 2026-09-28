import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

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
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const { variants, images, slug, ...productData } = dto;
    const finalSlug = slug || `${slugify(productData.name)}-${Date.now()}`;
    return this.prisma.product.create({
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
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async findAll(query?: {
    search?: string;
    categoryId?: number;
    brandId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, brandId, minPrice, maxPrice, page, limit } = query || {};

    const where: any = {
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
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
            category: true,
            variants: true,
            images: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
      ]);

      return {
        data,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take) || 1,
        },
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
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

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    const { variants, images, ...productData } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(variants
            ? {
                variants: {
                  create: variants,
                },
              }
            : {}),
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
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
