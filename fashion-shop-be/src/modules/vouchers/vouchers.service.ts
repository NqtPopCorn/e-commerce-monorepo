import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateVoucherDto } from "./dto/create-voucher.dto";
import { UpdateVoucherDto } from "./dto/update-voucher.dto";
import { VoucherQueryDto } from "./dto/voucher-query.dto";

@Injectable()
export class VouchersService {
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

  async create(dto: CreateVoucherDto, currentUser?: any, req?: any) {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existingCode = await this.prisma.voucher.findUnique({
      where: { code: normalizedCode },
    });
    if (existingCode) {
      throw new ConflictException(`Mã voucher "${normalizedCode}" đã tồn tại`);
    }

    if (dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
      });
      if (!camp) throw new BadRequestException("Chiến dịch được chọn không tồn tại");
    }

    const created = await this.prisma.voucher.create({
      data: {
        code: normalizedCode,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        campaignId: dto.campaignId,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscountValue: dto.maxDiscountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        maxUsesPerCustomer: dto.maxUsesPerCustomer ?? 1,
        budgetLimit: dto.budgetLimit,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        active: dto.active ?? true,
      },
      include: {
        campaign: true,
      },
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "VOUCHER_CREATE",
      entityType: "VOUCHER",
      entityId: String(created.id),
      description: `Tạo voucher mới: [${created.code}] ${created.name}`,
      newValue: {
        id: created.id,
        code: created.code,
        discountType: created.discountType,
        discountValue: created.discountValue,
        budgetLimit: created.budgetLimit,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return created;
  }

  async findAll(query: VoucherQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.VoucherWhereInput = {};

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.voucher.count({ where }),
      this.prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: true,
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
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        campaign: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException("Voucher không tồn tại");
    }

    return voucher;
  }

  async update(id: number, dto: UpdateVoucherDto, currentUser?: any, req?: any) {
    const existing = await this.findOne(id);

    let normalizedCode: string | undefined;
    if (dto.code) {
      normalizedCode = dto.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const dup = await this.prisma.voucher.findUnique({
          where: { code: normalizedCode },
        });
        if (dup) {
          throw new ConflictException(`Mã voucher "${normalizedCode}" đã tồn tại`);
        }
      }
    }

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

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: {
        code: normalizedCode,
        name: dto.name ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description?.trim() : undefined,
        campaignId:
          dto.campaignId !== undefined ? dto.campaignId : undefined,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscountValue: dto.maxDiscountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        maxUsesPerCustomer: dto.maxUsesPerCustomer,
        budgetLimit: dto.budgetLimit,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt:
          dto.endsAt !== undefined
            ? dto.endsAt
              ? new Date(dto.endsAt)
              : null
            : undefined,
        active: dto.active !== undefined ? dto.active : undefined,
      },
      include: {
        campaign: true,
      },
    });

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "VOUCHER_UPDATE",
      entityType: "VOUCHER",
      entityId: String(updated.id),
      description: `Cập nhật voucher: [${updated.code}] ${updated.name}`,
      oldValue: {
        code: existing.code,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        active: existing.active,
      },
      newValue: {
        code: updated.code,
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        active: updated.active,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return updated;
  }

  async remove(id: number, currentUser?: any, req?: any) {
    const existing = await this.findOne(id);

    const appCount = await this.prisma.voucherApplication.count({
      where: { voucherId: id },
    });

    if (appCount > 0 || existing.usedCount > 0) {
      await this.prisma.voucher.update({
        where: { id },
        data: { active: false },
      });
    } else {
      await this.prisma.voucher.delete({
        where: { id },
      });
    }

    const { ipAddress, userAgent } = this.extractIpAndUserAgent(req);
    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "VOUCHER_DELETE",
      entityType: "VOUCHER",
      entityId: String(id),
      description: `Xóa voucher: [${existing.code}] ${existing.name}`,
      oldValue: { id, code: existing.code },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return { success: true, message: "Đã xóa voucher" };
  }

  async checkCode(code: string) {
    if (!code || !code.trim()) {
      throw new BadRequestException("Mã voucher không được để trống");
    }

    const normalized = code.trim().toUpperCase();
    const now = new Date();

    const voucher = await this.prisma.voucher.findUnique({
      where: { code: normalized },
      include: {
        campaign: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException("Mã khuyến mãi không tồn tại");
    }

    if (!voucher.active) {
      throw new BadRequestException("Mã khuyến mãi đã bị khóa hoặc ngừng áp dụng");
    }

    if (voucher.startsAt && voucher.startsAt > now) {
      throw new BadRequestException("Mã khuyến mãi chưa đến đợt áp dụng");
    }

    if (voucher.endsAt && voucher.endsAt <= now) {
      throw new BadRequestException("Mã khuyến mãi đã hết hạn");
    }

    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      throw new BadRequestException("Mã khuyến mãi đã hết lượt sử dụng");
    }

    if (voucher.budgetLimit !== null) {
      const remaining = Number(voucher.budgetLimit) - Number(voucher.spentAmount || 0);
      if (remaining <= 0) {
        throw new BadRequestException("Mã khuyến mãi đã hết ngân sách áp dụng");
      }
    }

    if (voucher.campaign && voucher.campaign.budgetLimit !== null) {
      const campRemaining =
        Number(voucher.campaign.budgetLimit) - Number(voucher.campaign.spentAmount || 0);
      if (campRemaining <= 0) {
        throw new BadRequestException("Chiến dịch khuyến mãi đã hết ngân sách");
      }
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: Number(voucher.discountValue),
        maxDiscountValue:
          voucher.maxDiscountValue !== null ? Number(voucher.maxDiscountValue) : null,
        minOrderAmount:
          voucher.minOrderAmount !== null ? Number(voucher.minOrderAmount) : null,
        campaignId: voucher.campaignId,
        campaignName: voucher.campaign?.name,
      },
    };
  }
}
