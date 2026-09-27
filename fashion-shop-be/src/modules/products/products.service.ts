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

  findAll(query?: { search?: string; categoryId?: number; brandId?: number }) {
    const { search, categoryId, brandId } = query || {};
    return this.prisma.product.findMany({
      where: {
        ...(search
          ? { name: { contains: search, mode: "insensitive" } }
          : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
      },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
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
