import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

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
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    const trimmedName = (dto.name || "").trim();
    if (!trimmedName) {
      throw new BadRequestException("Tên thương hiệu không được để trống");
    }

    const existing = await this.prisma.brand.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      throw new BadRequestException(`Thương hiệu "${trimmedName}" đã tồn tại`);
    }

    let slug = dto.slug ? slugify(dto.slug) : slugify(trimmedName);
    const existingSlug = await this.prisma.brand.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.prisma.brand.create({
      data: {
        name: trimmedName,
        slug,
        logo: dto.logo || null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  findAll() {
    return this.prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            variants: true,
            images: { orderBy: { sortOrder: "asc" } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });
    if (!brand) throw new NotFoundException("Thương hiệu không tồn tại");
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException("Thương hiệu không tồn tại");

    const data: any = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestException("Tên thương hiệu không được để trống");
      }
      if (trimmedName !== brand.name) {
        const existing = await this.prisma.brand.findUnique({
          where: { name: trimmedName },
        });
        if (existing && existing.id !== id) {
          throw new BadRequestException(
            `Thương hiệu "${trimmedName}" đã tồn tại`,
          );
        }
      }
      data.name = trimmedName;

      if (!dto.slug) {
        let slug = slugify(trimmedName);
        const existingSlug = await this.prisma.brand.findUnique({
          where: { slug },
        });
        if (existingSlug && existingSlug.id !== id) {
          slug = `${slug}-${Date.now()}`;
        }
        data.slug = slug;
      }
    }

    if (dto.slug !== undefined) {
      let slug = slugify(dto.slug);
      const existingSlug = await this.prisma.brand.findUnique({
        where: { slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new BadRequestException(`Đường dẫn slug "${slug}" đã tồn tại`);
      }
      data.slug = slug;
    }

    if (dto.logo !== undefined) {
      data.logo = dto.logo || null;
    }

    return this.prisma.brand.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async remove(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!brand) throw new NotFoundException("Thương hiệu không tồn tại");

    if (brand._count.products > 0) {
      throw new BadRequestException(
        `Không thể xóa thương hiệu đang có ${brand._count.products} sản phẩm liên kết. Vui lòng gỡ hoặc chuyển sản phẩm trước.`,
      );
    }

    return this.prisma.brand.delete({ where: { id } });
  }
}
