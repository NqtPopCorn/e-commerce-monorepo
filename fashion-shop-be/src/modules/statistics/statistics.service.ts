import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [orders, revenue, productsSold] = await Promise.all([
      this.prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
      this.prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      this.prisma.orderItem.aggregate({ _sum: { quantity: true } }),
    ]);
    const soldCount = productsSold._sum.quantity ?? 0;
    return {
      orders,
      revenue: revenue._sum.total ?? 0,
      productsSold: soldCount,
      booksSold: soldCount, // Giữ để tương thích ngược nếu FE còn dùng
    };
  }

  async getRevenue() {
    // Lấy tất cả orders thành công trong năm nay
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear + 1, 0, 1);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: startDate, lt: endDate },
      },
      select: { total: true, createdAt: true },
    });

    const dataByMonth = Array.from({ length: 12 }).map((_, i) => ({
      name: `Tháng ${i + 1}`,
      revenue: 0,
      profit: 0, // Mock profit as 40% of revenue
    }));

    for (const order of orders) {
      const monthIndex = order.createdAt.getMonth();
      dataByMonth[monthIndex].revenue += Number(order.total);
      dataByMonth[monthIndex].profit += Number(order.total) * 0.4;
    }

    return dataByMonth;
  }

  async getStock() {
    // Lấy số lượng tồn kho theo danh mục
    const categories = await this.prisma.category.findMany({
      include: {
        products: { include: { variants: { select: { stock: true } } } },
      },
    });

    return categories.map((cat) => ({
      name: cat.name,
      stock: cat.products.reduce((sum, product) => {
        return (
          sum + product.variants.reduce((vSum, variant) => vSum + variant.stock, 0)
        );
      }, 0),
    }));
  }
}
