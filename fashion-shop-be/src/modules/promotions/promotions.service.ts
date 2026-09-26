import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountType, Prisma, PromotionKind } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { PromotionQueryDto } from "./dto/promotion-common.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private validatePromotionPayload(
    kind: PromotionKind,
    dto: Partial<CreatePromotionDto>,
    isUpdate = false,
  ) {
    if (dto.startsAt && dto.endsAt) {
      if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
        throw new BadRequestException(
          "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
        );
      }
    }

    if (kind === PromotionKind.VOUCHER) {
      if (!isUpdate && !dto.code?.trim()) {
        throw new BadRequestException("Voucher bắt buộc phải có mã code");
      }
      if (dto.groups && dto.groups.length > 0) {
        throw new BadRequestException("Voucher không được chứa campaign groups");
      }
      if (dto.discountType === DiscountType.PERCENT && dto.discountValue !== undefined) {
        if (
          !Number.isInteger(dto.discountValue) ||
          dto.discountValue < 1 ||
          dto.discountValue > 100
        ) {
          throw new BadRequestException(
            "Phần trăm giảm giá phải là số nguyên từ 1 đến 100",
          );
        }
      }
    } else if (kind === PromotionKind.ORDER_AUTO) {
      if (dto.code && dto.code.trim().length > 0) {
        throw new BadRequestException(
          "Khuyến mãi tự động không được chứa mã code",
        );
      }
      if (dto.groups && dto.groups.length > 0) {
        throw new BadRequestException(
          "Khuyến mãi tự động không được chứa campaign groups",
        );
      }
      if (dto.discountType === DiscountType.PERCENT && dto.discountValue !== undefined) {
        if (
          !Number.isInteger(dto.discountValue) ||
          dto.discountValue < 1 ||
          dto.discountValue > 100
        ) {
          throw new BadRequestException(
            "Phần trăm giảm giá phải là số nguyên từ 1 đến 100",
          );
        }
      }
    } else if (kind === PromotionKind.CAMPAIGN) {
      if (dto.code && dto.code.trim().length > 0) {
        throw new BadRequestException("Campaign không được chứa mã code");
      }
      if (
        dto.discountType !== undefined ||
        dto.discountValue !== undefined ||
        dto.minOrderAmount !== undefined
      ) {
        throw new BadRequestException(
          "Campaign không được chứa các trường giảm giá cấp hóa đơn",
        );
      }
      if (!isUpdate && (!dto.groups || dto.groups.length === 0)) {
        throw new BadRequestException("Campaign phải chứa ít nhất 1 nhóm sản phẩm");
      }

      if (dto.groups) {
        const seenVariantIds = new Set<number>();
        for (const group of dto.groups) {
          if (group.discountType === DiscountType.PERCENT) {
            if (
              !Number.isInteger(group.discountValue) ||
              group.discountValue < 1 ||
              group.discountValue > 100
            ) {
              throw new BadRequestException(
                `Nhóm "${group.name}": Phần trăm giảm giá phải là số nguyên từ 1 đến 100`,
              );
            }
          }
          if (group.discountValue <= 0) {
            throw new BadRequestException(
              `Nhóm "${group.name}": Giá trị giảm giá phải lớn hơn 0`,
            );
          }
          if (!group.variantIds || group.variantIds.length === 0) {
            throw new BadRequestException(
              `Nhóm "${group.name}" không có sản phẩm/biến thể nào`,
            );
          }
          for (const vId of group.variantIds) {
            if (seenVariantIds.has(vId)) {
              throw new BadRequestException(
                `Biến thể ID ${vId} bị trùng lặp trong campaign`,
              );
            }
            seenVariantIds.add(vId);
          }
        }
      }
    }
  }

  private async verifyVariantIdsExist(variantIds: number[]) {
    if (variantIds.length === 0) return;
    const existing = await this.prisma.bookVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((v) => v.id));
    const missing = variantIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Các biến thể sau không tồn tại: ${missing.join(", ")}`,
      );
    }
  }

  async create(dto: CreatePromotionDto) {
    this.validatePromotionPayload(dto.kind, dto, false);

    if (dto.kind === PromotionKind.CAMPAIGN && dto.groups) {
      const allVariantIds = dto.groups.flatMap((g) => g.variantIds);
      await this.verifyVariantIdsExist(allVariantIds);
    }

    const { groups, startsAt, endsAt, code, ...rest } = dto;

    return this.prisma.promotion.create({
      data: {
        ...rest,
        code: dto.kind === PromotionKind.VOUCHER ? code?.trim().toUpperCase() : null,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        groups:
          dto.kind === PromotionKind.CAMPAIGN && groups
            ? {
                create: groups.map((g) => ({
                  name: g.name,
                  sortOrder: g.sortOrder,
                  discountType: g.discountType,
                  discountValue: g.discountValue,
                  variants: {
                    create: g.variantIds.map((variantId) => ({
                      variantId,
                    })),
                  },
                })),
              }
            : undefined,
      },
      include: {
        groups: {
          include: {
            variants: true,
          },
        },
      },
    });
  }

  async findAll(query?: PromotionQueryDto) {
    const where: Prisma.PromotionWhereInput = {};

    if (query?.kind) {
      where.kind = query.kind;
    }
    if (query?.active !== undefined) {
      where.active = query.active;
    }
    if (query?.from || query?.to) {
      where.startsAt = {};
      if (query?.from) {
        where.startsAt.gte = new Date(query.from);
      }
      if (query?.to) {
        where.startsAt.lte = new Date(query.to);
      }
    }

    return this.prisma.promotion.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: {
              include: {
                variant: {
                  include: {
                    book: {
                      select: { id: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!promotion) throw new NotFoundException("Chương trình khuyến mãi không tồn tại");
    return promotion;
  }

  async checkCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const p = await this.prisma.promotion.findUnique({
      where: { code: normalizedCode },
    });
    if (!p) throw new NotFoundException("Mã khuyến mãi không tồn tại");
    if (!p.active) throw new BadRequestException("Mã khuyến mãi đã bị khoá");
    if (p.endsAt && p.endsAt < new Date())
      throw new BadRequestException("Mã khuyến mãi đã hết hạn");
    if (p.maxUses && p.usedCount >= p.maxUses)
      throw new BadRequestException("Mã khuyến mãi đã hết lượt sử dụng");

    return p;
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const existing = await this.findOne(id);
    const targetKind = dto.kind ?? existing.kind;

    this.validatePromotionPayload(targetKind, dto, true);

    if (targetKind === PromotionKind.CAMPAIGN && dto.groups) {
      const allVariantIds = dto.groups.flatMap((g) => g.variantIds);
      await this.verifyVariantIdsExist(allVariantIds);
    }

    const { groups, startsAt, endsAt, code, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (targetKind === PromotionKind.CAMPAIGN && groups !== undefined) {
        await tx.promotionGroup.deleteMany({
          where: { promotionId: id },
        });
      }

      return tx.promotion.update({
        where: { id },
        data: {
          ...rest,
          code:
            targetKind === PromotionKind.VOUCHER
              ? code !== undefined
                ? code.trim().toUpperCase()
                : existing.code
              : null,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
          groups:
            targetKind === PromotionKind.CAMPAIGN && groups !== undefined
              ? {
                  create: groups.map((g) => ({
                    name: g.name,
                    sortOrder: g.sortOrder,
                    discountType: g.discountType,
                    discountValue: g.discountValue,
                    variants: {
                      create: g.variantIds.map((variantId) => ({
                        variantId,
                      })),
                    },
                  })),
                }
              : undefined,
        },
        include: {
          groups: {
            include: {
              variants: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
