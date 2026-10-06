import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const trimmedName = (dto.name || "").trim();
    if (!trimmedName) {
      throw new BadRequestException("Tên danh mục không được để trống");
    }

    const existing = await this.prisma.category.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      throw new BadRequestException(`Tên danh mục "${trimmedName}" đã tồn tại`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException("Danh mục cha không tồn tại");
      }
      if (parent.parentId !== null) {
        throw new BadRequestException(
          "Hệ thống chỉ hỗ trợ danh mục tối đa 2 cấp. Không thể chọn danh mục con làm danh mục cha.",
        );
      }
    }

    return this.prisma.category.create({
      data: {
        name: trimmedName,
        parentId: dto.parentId ?? null,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: { id: "asc" },
    });
  }

  findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
    if (!category) throw new NotFoundException("Danh mục không tồn tại");
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: { select: { id: true }, take: 1 },
      },
    });
    if (!category) throw new NotFoundException("Danh mục không tồn tại");

    if (dto.name) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestException("Tên danh mục không được để trống");
      }
      if (trimmedName !== category.name) {
        const existing = await this.prisma.category.findUnique({
          where: { name: trimmedName },
        });
        if (existing && existing.id !== id) {
          throw new BadRequestException(
            `Tên danh mục "${trimmedName}" đã tồn tại`,
          );
        }
      }
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          "Danh mục không thể làm cha của chính nó",
        );
      }

      if (dto.parentId !== null) {
        if (category.children.length > 0) {
          throw new BadRequestException(
            "Danh mục này đang có danh mục con, không thể chuyển thành danh mục cấp 2.",
          );
        }

        const targetParent = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });
        if (!targetParent) {
          throw new NotFoundException("Danh mục cha không tồn tại");
        }
        if (targetParent.parentId !== null) {
          throw new BadRequestException(
            "Hệ thống chỉ hỗ trợ danh mục tối đa 2 cấp. Không thể chọn danh mục con làm danh mục cha.",
          );
        }
      } else {
        // dto.parentId === null -> trying to turn into root category
        if (category.products.length > 0) {
          throw new BadRequestException(
            "Danh mục này đang có sản phẩm gán vào, không thể chuyển thành danh mục gốc (chỉ danh mục lá mới được gán sản phẩm).",
          );
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        products: { select: { id: true }, take: 1 },
      },
    });
    if (!category) throw new NotFoundException("Danh mục không tồn tại");

    if (category.children.length > 0) {
      throw new BadRequestException(
        "Không thể xóa danh mục đang có danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.",
      );
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        "Không thể xóa danh mục đang có sản phẩm liên kết.",
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
