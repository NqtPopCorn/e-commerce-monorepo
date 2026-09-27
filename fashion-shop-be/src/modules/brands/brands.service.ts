import { Injectable, NotFoundException } from "@nestjs/common";
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
    const slug = dto.slug || slugify(dto.name);
    return this.prisma.brand.create({
      data: {
        ...dto,
        slug,
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
      },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = slugify(dto.name);
    }
    return this.prisma.brand.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.brand.delete({ where: { id } });
  }
}
