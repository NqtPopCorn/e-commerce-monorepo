import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { CampaignQueryDto } from "./dto/campaign-query.dto";

export type DerivedCampaignStatus = "SCHEDULED" | "ACTIVE" | "ENDED";

export function getCampaignStatus(
  startsAt: Date | string,
  endsAt?: Date | string | null,
  now = new Date(),
): DerivedCampaignStatus {
  const start = new Date(startsAt);
  if (now < start) {
    return "SCHEDULED";
  }
  if (endsAt) {
    const end = new Date(endsAt);
    if (now > end) {
      return "ENDED";
    }
  }
  return "ACTIVE";
}

@Injectable()
export class CampaignsService {
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

  async create(dto: CreateCampaignDto, currentUser?: any, req?: any) {
    const startsAt = new Date(dto.startsAt);
    if (isNaN(startsAt.getTime())) {
      throw new BadRequestException("Thời gian bắt đầu không hợp lệ");
    }

    let endsAt: Date | undefined;
    if (dto.endsAt) {
      endsAt = new Date(dto.endsAt);
      if (isNaN(endsAt.getTime())) {
        throw new BadRequestException("Thời gian kết thúc không hợp lệ");
      }
      if (endsAt <= startsAt) {
        throw new BadRequestException(
          "Thời gian kết thúc phải sau thời gian bắt đầu",
        );
      }
    }

    const created = await this.prisma.campaign.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        startsAt,
        endsAt,
        budgetLimit: dto.budgetLimit !== undefined ? dto.budgetLimit : null,
      },
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "CAMPAIGN_CREATE",
      entityType: "CAMPAIGN",
      entityId: String(created.id),
      description: `Tạo chiến dịch khuyến mãi: ${created.name}`,
      newValue: {
        id: created.id,
        name: created.name,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
        budgetLimit: created.budgetLimit,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return {
      ...created,
      status: getCampaignStatus(created.startsAt, created.endsAt),
    };
  }

  async findAll(query: CampaignQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const now = new Date();

    const andConditions: Prisma.CampaignWhereInput[] = [];

    if (query.search?.trim()) {
      const s = query.search.trim();
      andConditions.push({
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { description: { contains: s, mode: "insensitive" } },
        ],
      });
    }

    if (query.status) {
      if (query.status === "SCHEDULED") {
        andConditions.push({ startsAt: { gt: now } });
      } else if (query.status === "ACTIVE") {
        andConditions.push({
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        });
      } else if (query.status === "ENDED") {
        andConditions.push({
          endsAt: { not: null, lt: now },
        });
      }
    }

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) dateFilter.gte = new Date(query.from);
      if (query.to) dateFilter.lte = new Date(query.to);
      andConditions.push({ startsAt: dateFilter });
    }

    const where: Prisma.CampaignWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const orderByField = query.sortBy || "createdAt";
    const orderDirection = query.sortOrder || "desc";
    const orderBy: Prisma.CampaignOrderByWithRelationInput = {
      [orderByField]: orderDirection,
    };

    const [total, items] = await Promise.all([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              discounts: true,
              vouchers: true,
            },
          },
        },
      }),
    ]);

    const data = items.map((c) => ({
      ...c,
      status: getCampaignStatus(c.startsAt, c.endsAt, now),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        discounts: {
          orderBy: { priority: "desc" },
          include: {
            groups: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        vouchers: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            discounts: true,
            vouchers: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Chiến dịch khuyến mãi không tồn tại");
    }

    return {
      ...campaign,
      status: getCampaignStatus(campaign.startsAt, campaign.endsAt),
    };
  }

  async update(
    id: number,
    dto: UpdateCampaignDto,
    currentUser?: any,
    req?: any,
  ) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException("Chiến dịch khuyến mãi không tồn tại");
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : campaign.startsAt;
    let endsAt =
      dto.endsAt !== undefined
        ? dto.endsAt
          ? new Date(dto.endsAt)
          : null
        : campaign.endsAt;

    if (endsAt && startsAt && endsAt <= startsAt) {
      throw new BadRequestException(
        "Thời gian kết thúc phải sau thời gian bắt đầu",
      );
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : undefined,
        startsAt: dto.startsAt ? startsAt : undefined,
        endsAt: dto.endsAt !== undefined ? endsAt : undefined,
        budgetLimit:
          dto.budgetLimit !== undefined ? dto.budgetLimit : undefined,
      },
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "CAMPAIGN_UPDATE",
      entityType: "CAMPAIGN",
      entityId: String(updated.id),
      description: `Cập nhật chiến dịch khuyến mãi: ${updated.name}`,
      oldValue: {
        name: campaign.name,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        budgetLimit: campaign.budgetLimit,
      },
      newValue: {
        name: updated.name,
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
        budgetLimit: updated.budgetLimit,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return {
      ...updated,
      status: getCampaignStatus(updated.startsAt, updated.endsAt),
    };
  }

  async remove(id: number, currentUser?: any, req?: any) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            discounts: true,
            vouchers: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Chiến dịch khuyến mãi không tồn tại");
    }

    await this.prisma.campaign.delete({ where: { id } });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "CAMPAIGN_DELETE",
      entityType: "CAMPAIGN",
      entityId: String(id),
      description: `Xóa chiến dịch: ${campaign.name} (chứa ${campaign._count.discounts} giảm giá, ${campaign._count.vouchers} voucher)`,
      oldValue: {
        id: campaign.id,
        name: campaign.name,
        spentAmount: campaign.spentAmount,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return {
      success: true,
      message: "Đã xóa chiến dịch thành công",
    };
  }

  async getStats(id: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        discounts: {
          select: {
            id: true,
            name: true,
            active: true,
            spentAmount: true,
            budgetLimit: true,
            maxUses: true,
            usedCount: true,
            startsAt: true,
            endsAt: true,
            groups: {
              select: {
                discountType: true,
                discountValue: true,
                maxDiscountValue: true,
              },
            },
          },
        },
        vouchers: {
          select: {
            id: true,
            code: true,
            name: true,
            active: true,
            discountType: true,
            discountValue: true,
            maxDiscountValue: true,
            budgetLimit: true,
            spentAmount: true,
            maxUses: true,
            usedCount: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Chiến dịch khuyến mãi không tồn tại");
    }

    const discountIds = campaign.discounts.map((d) => d.id);
    const voucherIds = campaign.vouchers.map((v) => v.id);

    let discountApps: any[] = [];
    if (discountIds.length > 0) {
      discountApps = await this.prisma.discountApplication.findMany({
        where: { discountId: { in: discountIds } },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          orderItem: {
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
      });
    }

    let voucherApps: any[] = [];
    if (voucherIds.length > 0) {
      voucherApps = await this.prisma.voucherApplication.findMany({
        where: { voucherId: { in: voucherIds } },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
        },
      });
    }

    // Aggregate discount amounts
    let totalDiscountAmount = 0;
    const orderMap = new Map<
      number,
      {
        id: number;
        userId: number;
        total: number;
        status: string;
        createdAt: Date;
      }
    >();

    // Product breakdown
    const productStatsMap = new Map<
      string,
      {
        productId?: number;
        productName: string;
        sku: string;
        appliedCount: number;
        totalDiscount: number;
        totalQuantity: number;
      }
    >();

    for (const app of discountApps) {
      const amount = Number(app.discountAmount) || 0;
      totalDiscountAmount += amount;

      if (app.order) {
        orderMap.set(app.order.id, {
          id: app.order.id,
          userId: app.order.userId,
          total: Number(app.order.total) || 0,
          status: app.order.status,
          createdAt: app.order.createdAt,
        });
      }

      if (app.orderItem?.variant) {
        const variant = app.orderItem.variant;
        const productName = variant.product?.name || "Sản phẩm";
        const sku = variant.sku || "";
        const key = `${productName}__${sku}`;
        const existing = productStatsMap.get(key) || {
          productId: variant.productId,
          productName,
          sku,
          appliedCount: 0,
          totalDiscount: 0,
          totalQuantity: 0,
        };
        existing.appliedCount += 1;
        existing.totalDiscount += amount;
        existing.totalQuantity += app.orderItem.quantity || 1;
        productStatsMap.set(key, existing);
      }
    }

    for (const app of voucherApps) {
      const amount = Number(app.discountAmount) || 0;
      totalDiscountAmount += amount;

      if (app.order) {
        orderMap.set(app.order.id, {
          id: app.order.id,
          userId: app.order.userId,
          total: Number(app.order.total) || 0,
          status: app.order.status,
          createdAt: app.order.createdAt,
        });
      }
    }

    // Orders and unique customers
    const uniqueOrders = Array.from(orderMap.values());
    const validOrders = uniqueOrders.filter((o) => o.status !== "CANCELLED");
    const uniqueCustomerIds = new Set(validOrders.map((o) => o.userId));
    const totalOrderRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

    // Top products sorted by totalDiscount desc
    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.totalDiscount - a.totalDiscount)
      .slice(0, 10);

    const budgetLimit =
      campaign.budgetLimit !== null ? Number(campaign.budgetLimit) : null;
    const spentAmount = Number(campaign.spentAmount) || totalDiscountAmount;
    const remainingBudget =
      budgetLimit !== null ? Math.max(0, budgetLimit - spentAmount) : null;
    const percentSpent =
      budgetLimit && budgetLimit > 0
        ? Math.min(100, Math.round((spentAmount / budgetLimit) * 1000) / 10)
        : null;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        budgetLimit,
        spentAmount,
        remainingBudget,
        percentSpent,
        status: getCampaignStatus(campaign.startsAt, campaign.endsAt),
      },
      summary: {
        totalDiscounts: campaign.discounts.length,
        activeDiscounts: campaign.discounts.filter((d) => d.active).length,
        totalVouchers: campaign.vouchers.length,
        activeVouchers: campaign.vouchers.filter((v) => v.active).length,
        discountApplicationsCount: discountApps.length,
        voucherApplicationsCount: voucherApps.length,
        totalApplicationsCount: discountApps.length + voucherApps.length,
        totalDiscountAmount,
        totalOrdersImpacted: validOrders.length,
        uniqueCustomerCount: uniqueCustomerIds.size,
        totalOrderRevenue,
      },
      topProducts,
      discounts: campaign.discounts.map((d) => ({
        id: d.id,
        name: d.name,
        active: d.active,
        spentAmount: Number(d.spentAmount) || 0,
        budgetLimit: d.budgetLimit !== null ? Number(d.budgetLimit) : null,
        usedCount: d.usedCount,
        maxUses: d.maxUses,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        groups: d.groups,
      })),
      vouchers: campaign.vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        active: v.active,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        maxDiscountValue:
          v.maxDiscountValue !== null ? Number(v.maxDiscountValue) : null,
        spentAmount: Number(v.spentAmount) || 0,
        budgetLimit: v.budgetLimit !== null ? Number(v.budgetLimit) : null,
        usedCount: v.usedCount,
        maxUses: v.maxUses,
        startsAt: v.startsAt,
        endsAt: v.endsAt,
      })),
    };
  }
}
