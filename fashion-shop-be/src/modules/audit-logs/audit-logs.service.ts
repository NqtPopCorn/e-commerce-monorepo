import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAuditLogDto } from "./dto/create-audit-log.dto";
import { QueryAuditLogsDto } from "./dto/query-audit-logs.dto";

const SENSITIVE_KEYS = new Set([
  "password",
  "oldpassword",
  "newpassword",
  "token",
  "refreshtoken",
  "secret",
  "creditcard",
  "cvv",
  "authorization",
]);

function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (val && typeof val === "object") {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe, non-blocking method to record an audit log event.
   * If writing to DB fails, logs error to logger without disrupting business operation.
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: dto.userId ?? null,
          userEmail: dto.userEmail ?? null,
          userRole: dto.userRole ?? null,
          action: dto.action,
          entityType: dto.entityType,
          entityId: dto.entityId ? String(dto.entityId) : null,
          description: dto.description ?? null,
          oldValue: dto.oldValue ? sanitizeData(dto.oldValue) : undefined,
          newValue: dto.newValue ? sanitizeData(dto.newValue) : undefined,
          ipAddress: dto.ipAddress ?? null,
          userAgent: dto.userAgent ?? null,
          status: dto.status ?? "SUCCESS",
          errorMessage: dto.errorMessage ?? null,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to record audit log for action ${dto.action}: ${err?.message}`,
        err?.stack,
      );
    }
  }

  async findAll(query: QueryAuditLogsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.userId) {
      where.userId = Number(query.userId);
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { description: { contains: term, mode: "insensitive" } },
        { userEmail: { contains: term, mode: "insensitive" } },
        { entityId: { contains: term, mode: "insensitive" } },
        { action: { contains: term, mode: "insensitive" } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        // Include full end date till end of day if only YYYY-MM-DD
        if (query.endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = end;
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getDetail(id: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException("Bản ghi nhật ký kiểm toán không tồn tại");
    }

    return log;
  }

  async getSummary() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, failedCount, activeUsersRaw] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.auditLog.count({
        where: { status: "FAILED" },
      }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, userEmail: { not: null } },
        distinct: ["userEmail"],
        select: { userEmail: true },
      }),
    ]);

    return {
      total,
      todayCount,
      failedCount,
      activeUsersCount: activeUsersRaw.length,
    };
  }
}
