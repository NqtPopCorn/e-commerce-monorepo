import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface DateFilter {
  from: Date;
  to: Date;
}

export interface DimensionFilters {
  categoryId?: number;
  brandId?: number;
  productId?: number;
  campaignId?: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo điều kiện WHERE cho Order theo ngày và các filter lọc
   */
  private buildOrderWhereInput(
    dateRange: DateFilter,
    filters?: DimensionFilters,
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {
      status: "COMPLETED",
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    };

    if (filters?.categoryId || filters?.brandId || filters?.productId) {
      where.items = {
        some: {
          variant: {
            productId: filters.productId,
            product: {
              categoryId: filters.categoryId,
              brandId: filters.brandId,
            },
          },
        },
      };
    }

    if (filters?.campaignId) {
      where.OR = [
        {
          discountApplications: {
            some: {
              discount: {
                campaignId: filters.campaignId,
              },
            },
          },
        },
        {
          voucherApplications: {
            some: {
              voucher: {
                campaignId: filters.campaignId,
              },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Lấy danh sách Order hoàn tất trong chu kỳ
   */
  async getOrders(dateRange: DateFilter, filters?: DimensionFilters) {
    const where = this.buildOrderWhereInput(dateRange, filters);
    return this.prisma.order.findMany({
      where,
      select: {
        id: true,
        total: true,
        subtotal: true,
        productDiscount: true,
        voucherDiscount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Lấy tổng hợp doanh thu và số đơn
   */
  async getOrderSummary(dateRange: DateFilter, filters?: DimensionFilters) {
    const where = this.buildOrderWhereInput(dateRange, filters);
    const [count, aggregate] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          total: true,
          subtotal: true,
          productDiscount: true,
          voucherDiscount: true,
        },
      }),
    ]);

    return {
      ordersCount: count,
      netSales: Number(aggregate._sum.total ?? 0),
      grossSales: Number(aggregate._sum.subtotal ?? 0),
      productDiscount: Number(aggregate._sum.productDiscount ?? 0),
      voucherDiscount: Number(aggregate._sum.voucherDiscount ?? 0),
      discountCost:
        Number(aggregate._sum.productDiscount ?? 0) +
        Number(aggregate._sum.voucherDiscount ?? 0),
    };
  }

  /**
   * Lấy Order Items của các đơn hoàn tất để thống kê sản phẩm và số lượng bán
   */
  async getOrderItems(dateRange: DateFilter, filters?: DimensionFilters) {
    const orderWhere = this.buildOrderWhereInput(dateRange, filters);

    return this.prisma.orderItem.findMany({
      where: {
        order: orderWhere,
        variant: {
          productId: filters?.productId,
          product: {
            categoryId: filters?.categoryId,
            brandId: filters?.brandId,
          },
        },
      },
      select: {
        id: true,
        orderId: true,
        variantId: true,
        quantity: true,
        finalUnitPrice: true,
        productDiscount: true,
        originalUnitPrice: true,
        variant: {
          select: {
            id: true,
            sku: true,
            stock: true,
            sellingPrice: true,
            size: true,
            color: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                categoryId: true,
                brandId: true,
                category: { select: { id: true, name: true } },
                brand: { select: { id: true, name: true } },
                images: {
                  select: { url: true },
                  orderBy: { sortOrder: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Lấy các bản ghi DiscountApplication và VoucherApplication
   */
  async getPromotionApplications(dateRange: DateFilter) {
    const orderWhere: Prisma.OrderWhereInput = {
      status: "COMPLETED",
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    };

    const [discountApps, voucherApps, campaigns] = await Promise.all([
      this.prisma.discountApplication.findMany({
        where: { order: orderWhere },
        select: {
          id: true,
          orderId: true,
          discountId: true,
          discountName: true,
          discountAmount: true,
          order: { select: { total: true } },
          discount: {
            select: {
              campaignId: true,
              campaign: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.voucherApplication.findMany({
        where: { order: orderWhere },
        select: {
          id: true,
          orderId: true,
          voucherId: true,
          voucherName: true,
          voucherCode: true,
          discountAmount: true,
          order: { select: { total: true } },
          voucher: {
            select: {
              campaignId: true,
              campaign: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          budgetLimit: true,
          spentAmount: true,
        },
      }),
    ]);

    return { discountApps, voucherApps, campaigns };
  }

  /**
   * Lấy danh sách tất cả các biến thể kèm thông tin sản phẩm để phân tích kho
   */
  async getAllVariants() {
    return this.prisma.productVariant.findMany({
      select: {
        id: true,
        sku: true,
        stock: true,
        sellingPrice: true,
        size: true,
        color: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Lấy danh mục kèm sản phẩm
   */
  async getCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Lấy thống kê khách hàng theo Tier
   */
  async getCustomerTiers() {
    return this.prisma.user.groupBy({
      by: ["tier"],
      where: { role: "CUSTOMER" },
      _count: { id: true },
    });
  }
}
