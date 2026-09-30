import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { Prisma } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

export interface FindPurchasesQuery {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string;
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreatePurchaseDto,
    currentUser?: { id: number; email: string; role: string },
    req?: any,
  ) {
    const code =
      dto.code ||
      `PN-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.costPrice,
      0,
    );

    const receipt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseReceipt.create({
        data: {
          code,
          supplier: dto.supplier || "Fashion Shop Official",
          note: dto.note,
          totalAmount,
          items: {
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              costPrice: item.costPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      });

      // Cập nhật tăng số lượng tồn kho (stock) cho từng biến thể
      for (const item of dto.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return created;
    });

    const rawIp =
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;
    const ipAddress =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
    const userAgent = (req?.headers?.["user-agent"] as string) || null;

    await this.auditLogsService.log({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      action: "PURCHASE_RECEIPT_CREATE",
      entityType: "PURCHASE",
      entityId: String(receipt.id),
      description: `Tạo phiếu nhập kho #${receipt.code} (Tổng: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalAmount)}, ${dto.items.length} mặt hàng)`,
      newValue: {
        id: receipt.id,
        code: receipt.code,
        supplier: receipt.supplier,
        totalAmount,
        itemsCount: dto.items.length,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    return receipt;
  }

  async findAll(query?: FindPurchasesQuery) {
    const where: Prisma.PurchaseReceiptWhereInput = {};

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { supplier: { contains: s, mode: "insensitive" } },
        { note: { contains: s, mode: "insensitive" } },
        {
          items: {
            some: {
              variant: {
                OR: [
                  { sku: { contains: s, mode: "insensitive" } },
                  {
                    product: {
                      name: { contains: s, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
          },
        },
      ];
    }

    if (query?.supplier) {
      where.supplier = { contains: query.supplier.trim(), mode: "insensitive" };
    }

    const { page, limit } = query || {};
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * take;

      const [total, data] = await Promise.all([
        this.prisma.purchaseReceipt.count({ where }),
        this.prisma.purchaseReceipt.findMany({
          where,
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
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

    return this.prisma.purchaseReceipt.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats() {
    const [totalPurchases, aggregates, allItems] = await Promise.all([
      this.prisma.purchaseReceipt.count(),
      this.prisma.purchaseReceipt.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.purchaseReceiptItem.aggregate({
        _sum: {
          quantity: true,
        },
      }),
    ]);

    return {
      totalPurchases,
      totalSpending: Number(aggregates._sum.totalAmount || 0),
      totalQuantity: allItems._sum.quantity || 0,
    };
  }

  async findOne(id: number) {
    const receipt = await this.prisma.purchaseReceipt.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException(`Phiếu nhập với ID ${id} không tồn tại`);
    }

    return receipt;
  }
}
