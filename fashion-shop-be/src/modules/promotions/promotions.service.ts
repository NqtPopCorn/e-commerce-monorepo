import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountType, Prisma, PromotionApplicationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { PromotionQueryDto } from "./dto/promotion-common.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private validatePromotionPayload(
    applicationType: PromotionApplicationType,
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

    if (
      dto.budgetLimit !== undefined &&
      dto.budgetLimit !== null &&
      dto.budgetLimit < 0
    ) {
      throw new BadRequestException(
        "Ngân sách (budgetLimit) không được nhỏ hơn 0",
      );
    }

    if (applicationType === PromotionApplicationType.VOUCHER) {
      const hasVouchers =
        (dto.vouchers && dto.vouchers.length > 0) || dto.code?.trim();
      if (!isUpdate && !hasVouchers) {
        throw new BadRequestException(
          "Chương trình khuyến mãi Voucher bắt buộc phải có ít nhất 1 mã code",
        );
      }
    }

    if (!isUpdate && (!dto.groups || dto.groups.length === 0)) {
      throw new BadRequestException(
        "Chương trình khuyến mãi phải có ít nhất 1 nhóm quy tắc chiết khấu (groups)",
      );
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
        if (
          group.maxDiscountValue !== undefined &&
          group.maxDiscountValue !== null &&
          group.maxDiscountValue < 0
        ) {
          throw new BadRequestException(
            `Nhóm "${group.name}": Giảm giá tối đa không được âm`,
          );
        }
        if (group.variantIds && group.variantIds.length > 0) {
          for (const vId of group.variantIds) {
            if (seenVariantIds.has(vId)) {
              throw new BadRequestException(
                `Biến thể ID ${vId} bị trùng lặp giữa các nhóm sản phẩm`,
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
    const existing = await this.prisma.productVariant.findMany({
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
    this.validatePromotionPayload(dto.applicationType, dto, false);

    if (dto.groups) {
      const allVariantIds = dto.groups.flatMap((g) => g.variantIds || []);
      await this.verifyVariantIdsExist(allVariantIds);
    }

    const {
      groups,
      vouchers,
      code,
      maxUsesPerCustomer,
      startsAt,
      endsAt,
      ...rest
    } = dto;

    const vouchersToCreate: {
      code: string;
      maxUses?: number;
      maxUsesPerCustomer?: number;
      startsAt?: Date | null;
      endsAt?: Date | null;
      active?: boolean;
    }[] = [];

    if (dto.applicationType === PromotionApplicationType.VOUCHER) {
      if (vouchers && vouchers.length > 0) {
        for (const v of vouchers) {
          vouchersToCreate.push({
            code: v.code.trim().toUpperCase(),
            maxUses: v.maxUses ?? dto.maxUses,
            maxUsesPerCustomer: v.maxUsesPerCustomer ?? maxUsesPerCustomer ?? 1,
            startsAt: v.startsAt
              ? new Date(v.startsAt)
              : startsAt
                ? new Date(startsAt)
                : null,
            endsAt: v.endsAt
              ? new Date(v.endsAt)
              : endsAt
                ? new Date(endsAt)
                : null,
            active: v.active ?? dto.active ?? true,
          });
        }
      } else if (code && code.trim().length > 0) {
        vouchersToCreate.push({
          code: code.trim().toUpperCase(),
          maxUses: dto.maxUses,
          maxUsesPerCustomer: maxUsesPerCustomer ?? 1,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          active: dto.active ?? true,
        });
      }
    }

    return this.prisma.promotion.create({
      data: {
        ...rest,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        groups: groups
          ? {
              create: groups.map((g, idx) => ({
                name: g.name,
                sortOrder: g.sortOrder ?? idx + 1,
                discountType: g.discountType,
                discountValue: g.discountValue,
                maxDiscountValue: g.maxDiscountValue,
                variants:
                  g.variantIds && g.variantIds.length > 0
                    ? {
                        create: g.variantIds.map((variantId) => ({
                          variantId,
                        })),
                      }
                    : undefined,
              })),
            }
          : undefined,
        vouchers:
          vouchersToCreate.length > 0
            ? {
                create: vouchersToCreate,
              }
            : undefined,
      },
      include: {
        campaign: true,
        groups: {
          include: {
            variants: true,
          },
        },
        vouchers: true,
      },
    });
  }

  async findAll(query?: PromotionQueryDto) {
    const where: Prisma.PromotionWhereInput = {};

    if (query?.applicationType) {
      where.applicationType = query.applicationType;
    }
    if (query?.campaignId !== undefined) {
      where.campaignId = query.campaignId;
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
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        {
          vouchers: {
            some: { code: { contains: query.search, mode: "insensitive" } },
          },
        },
      ];
    }

    const include = {
      campaign: true,
      groups: {
        include: {
          variants: {
            select: { variantId: true },
          },
        },
      },
      vouchers: true,
    };

    if (query?.page !== undefined || query?.limit !== undefined) {
      const pageNum = Math.max(1, Number(query?.page) || 1);
      const take = Math.max(1, Number(query?.limit) || 10);
      const skip = (pageNum - 1) * take;

      const [total, data] = await Promise.all([
        this.prisma.promotion.count({ where }),
        this.prisma.promotion.findMany({
          where,
          include,
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
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

    return this.prisma.promotion.findMany({
      where,
      include,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        campaign: true,
        vouchers: true,
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!promotion)
      throw new NotFoundException("Chương trình khuyến mãi không tồn tại");
    return promotion;
  }

  async checkCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    const voucher = await this.prisma.voucher.findUnique({
      where: { code: normalizedCode },
      include: {
        promotion: {
          include: {
            campaign: true,
            groups: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!voucher) throw new NotFoundException("Mã khuyến mãi không tồn tại");
    if (!voucher.active || !voucher.promotion.active)
      throw new BadRequestException("Mã khuyến mãi đã bị khoá");
    if (voucher.startsAt && voucher.startsAt > now)
      throw new BadRequestException("Mã khuyến mãi chưa đến đợt áp dụng");
    if (voucher.endsAt && voucher.endsAt <= now)
      throw new BadRequestException("Mã khuyến mãi đã hết hạn");
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses)
      throw new BadRequestException("Mã khuyến mãi đã hết lượt sử dụng");

    // Kiểm tra ngân sách chương trình
    const promoRemaining =
      voucher.promotion.budgetLimit !== null
        ? Math.max(
            0,
            Number(voucher.promotion.budgetLimit) -
              Number(voucher.promotion.spentAmount),
          )
        : Infinity;
    const campaignRemaining =
      voucher.promotion.campaign &&
      voucher.promotion.campaign.budgetLimit !== null
        ? Math.max(
            0,
            Number(voucher.promotion.campaign.budgetLimit) -
              Number(voucher.promotion.campaign.spentAmount),
          )
        : Infinity;

    if (Math.min(promoRemaining, campaignRemaining) <= 0) {
      throw new BadRequestException(
        "Chương trình khuyến mãi đã hết ngân sách khả dụng",
      );
    }

    return voucher;
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const existing = await this.findOne(id);
    const targetType = dto.applicationType ?? existing.applicationType;

    this.validatePromotionPayload(targetType, dto, true);

    if (dto.groups) {
      const allVariantIds = dto.groups.flatMap((g) => g.variantIds || []);
      await this.verifyVariantIdsExist(allVariantIds);
    }

    const {
      groups,
      vouchers,
      code,
      maxUsesPerCustomer,
      startsAt,
      endsAt,
      ...rest
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (groups !== undefined) {
        await tx.promotionGroup.deleteMany({
          where: { promotionId: id },
        });
      }

      if (vouchers !== undefined && vouchers.length > 0) {
        await tx.voucher.deleteMany({
          where: { promotionId: id },
        });
      }

      return tx.promotion.update({
        where: { id },
        data: {
          ...rest,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt:
            endsAt !== undefined
              ? endsAt
                ? new Date(endsAt)
                : null
              : undefined,
          groups:
            groups !== undefined
              ? {
                  create: groups.map((g, idx) => ({
                    name: g.name,
                    sortOrder: g.sortOrder ?? idx + 1,
                    discountType: g.discountType,
                    discountValue: g.discountValue,
                    maxDiscountValue: g.maxDiscountValue,
                    variants:
                      g.variantIds && g.variantIds.length > 0
                        ? {
                            create: g.variantIds.map((variantId) => ({
                              variantId,
                            })),
                          }
                        : undefined,
                  })),
                }
              : undefined,
          vouchers:
            vouchers !== undefined && vouchers.length > 0
              ? {
                  create: vouchers.map((v) => ({
                    code: v.code.trim().toUpperCase(),
                    maxUses: v.maxUses,
                    maxUsesPerCustomer: v.maxUsesPerCustomer ?? 1,
                    startsAt: v.startsAt ? new Date(v.startsAt) : null,
                    endsAt: v.endsAt ? new Date(v.endsAt) : null,
                    active: v.active ?? true,
                  })),
                }
              : undefined,
        },
        include: {
          campaign: true,
          groups: {
            include: {
              variants: true,
            },
          },
          vouchers: true,
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
