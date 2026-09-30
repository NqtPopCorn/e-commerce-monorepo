import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: { include: { variant: { include: { product: true } } } },
        promotionApplications: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: number, status?: string, paymentStatus?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    const data: any = {};

    if (status) {
      const allowed = [
        "PENDING",
        "CONFIRMED",
        "SHIPPING",
        "COMPLETED",
        "CANCELLED",
      ];
      if (!allowed.includes(status))
        throw new BadRequestException("Invalid order status");
      data.status = status as any;

      if (
        status === "COMPLETED" &&
        order.paymentMethod === "COD" &&
        !paymentStatus
      ) {
        data.paymentStatus = "PAID";
      }
    }

    if (paymentStatus) {
      const allowedPaymentStatus = ["UNPAID", "PAID", "REFUNDED"];
      if (!allowedPaymentStatus.includes(paymentStatus))
        throw new BadRequestException("Invalid payment status");
      data.paymentStatus = paymentStatus as any;
    }

    if (Object.keys(data).length === 0) {
      return order;
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: { include: { variant: { include: { product: true } } } },
        promotionApplications: true,
      },
    });
  }
}
