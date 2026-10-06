import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { DiscountQueryDto } from "./dto/discount-query.dto";

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private extractIpAndUserAgent(req?: any) {
    const rawIp =
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;
    const ipAddress =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
    const userAgent = (req?.headers?.["user-agent"] as string) || null;
    return { ipAddress, userAgent };
  }

  private async verifyVariantIdsExist(
    variantIds: number[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    if (variantIds.length === 0) return;

    const uniqueIds = Array.from(new Set(variantIds));
    const count = await client.productVariant.count({
      where: { id: { in: uniqueIds } },
    });

    if (count !== uniqueIds.length) {
      throw new BadRequestException(
        "Một hoặc nhiều mã biến thể sản phẩm (variantId) không tồn tại trong hệ thống",
      );
    }
  }

  async create(dto: CreateDiscountDto, currentUser?: any, req?: any) {
    if (dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
      });
      if (!camp) throw new BadRequestException("Chiến dịch được chọn không tồn tại");
    }

    // Lấy toàn bộ variantIds của tất cả groups
    const allVariantIds: number[] = [];
    for (const g of dto.groups) {
      if (!g.variantIds || g.variantIds.length === 0) {
        throw new BadRequestException(
          `Nhóm giảm giá "${g.name}" phải có ít nhất 1 sản phẩm/biến thể áp dụng`,
        );
      }
      allVariantIds.push(...g.variantIds);
    }

    await this.verifyVariantIdsExist(allVariantIds);

    const created = await this.prisma.$transaction(async (tx) => {
      return tx.discount.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
          campaignId: dto.campaignId,
          priority: dto.priority ?? 0,
          budgetLimit: dto.budgetLimit,
          maxUses: dto.maxUses,
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          active: dto.active ?? true,
          groups: {
            create: dto.groups.map((g) => ({
              name: g.name.trim(),
              sortOrder: g.sortOrder ?? 0,
              discountType: g.discountType,
              discountValue: g.discountValue,
              maxDiscountValue: g.maxDiscountValue,
              variants: {
                create: g.variantIds.map((vId) => ({ variantId: vId })),
              },
            })),
          },
        },
        include: {
          campaign: true,
          groups: {
            include: {
              variants: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "DISCOUNT_CREATE",
      entityType: "DISCOUNT",
      entityId: String(created.id),
      description: `Tạo chương trình giảm giá: ${created.name}`,
      newValue: {
        id: created.id,
        name: created.name,
        budgetLimit: created.budgetLimit,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return created;
  }

  async findAll(query: DiscountQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.DiscountWhereInput = {};

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = new Date(query.from);
      if (query.to) where.startsAt.lte = new Date(query.to);
    }

    const [total, data] = await Promise.all([
      this.prisma.discount.count({ where }),
      this.prisma.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          campaign: true,
          groups: {
            include: {
              variants: {
                select: { variantId: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        campaign: true,
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException("Chương trình giảm giá không tồn tại");
    }

    return discount;
  }

  async update(
    id: number,
    dto: UpdateDiscountDto,
    currentUser?: any,
    req?: any,
  ) {
    const existing = await this.findOne(id);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined
        ? dto.endsAt
          ? new Date(dto.endsAt)
          : null
        : existing.endsAt;

    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
      });
      if (!camp) throw new BadRequestException("Chiến dịch được chọn không tồn tại");
    }

    if (dto.groups) {
      const allVariantIds: number[] = [];
      for (const g of dto.groups) {
        if (!g.variantIds || g.variantIds.length === 0) {
          throw new BadRequestException(
            `Nhóm giảm giá "${g.name}" phải có ít nhất 1 sản phẩm/biến thể áp dụng`,
          );
        }
        allVariantIds.push(...g.variantIds);
      }
      await this.verifyVariantIdsExist(allVariantIds);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.groups !== undefined) {
        await tx.discountGroup.deleteMany({
          where: { discountId: id },
        });
      }

      return tx.discount.update({
        where: { id },
        data: {
          name: dto.name ? dto.name.trim() : undefined,
          description:
            dto.description !== undefined ? dto.description?.trim() : undefined,
          campaignId:
            dto.campaignId !== undefined ? dto.campaignId : undefined,
          priority: dto.priority !== undefined ? dto.priority : undefined,
          budgetLimit:
            dto.budgetLimit !== undefined ? dto.budgetLimit : undefined,
          maxUses: dto.maxUses !== undefined ? dto.maxUses : undefined,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt:
            dto.endsAt !== undefined
              ? dto.endsAt
                ? new Date(dto.endsAt)
                : null
              : undefined,
          active: dto.active !== undefined ? dto.active : undefined,
          groups:
            dto.groups !== undefined
              ? {
                  create: dto.groups.map((g) => ({
                    name: g.name.trim(),
                    sortOrder: g.sortOrder ?? 0,
                    discountType: g.discountType,
                    discountValue: g.discountValue,
                    maxDiscountValue: g.maxDiscountValue,
                    variants: {
                      create: g.variantIds.map((vId) => ({ variantId: vId })),
                    },
                  })),
                }
              : undefined,
        },
        include: {
          campaign: true,
          groups: {
            include: {
              variants: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "DISCOUNT_UPDATE",
      entityType: "DISCOUNT",
      entityId: String(updated.id),
      description: `Cập nhật chương trình giảm giá: ${updated.name}`,
      oldValue: {
        name: existing.name,
        active: existing.active,
        budgetLimit: existing.budgetLimit,
      },
      newValue: {
        name: updated.name,
        active: updated.active,
        budgetLimit: updated.budgetLimit,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return updated;
  }

  async remove(id: number, currentUser?: any, req?: any) {
    const existing = await this.findOne(id);

    // Kiểm tra nếu đã có đơn hàng áp dụng giảm giá này
    const appCount = await this.prisma.discountApplication.count({
      where: { discountId: id },
    });

    if (appCount > 0) {
      // Bảo toàn lịch sử đơn hàng bằng cách vô hiệu hóa
      await this.prisma.discount.update({
        where: { id },
        data: { active: false },
      });
    } else {
      await this.prisma.discount.delete({
        where: { id },
      });
    }

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "DISCOUNT_DELETE",
      entityType: "DISCOUNT",
      entityId: String(id),
      description: `Xóa chương trình giảm giá: ${existing.name}`,
      oldValue: { id, name: existing.name },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return { success: true, message: "Đã xóa chương trình giảm giá" };
  }
}
