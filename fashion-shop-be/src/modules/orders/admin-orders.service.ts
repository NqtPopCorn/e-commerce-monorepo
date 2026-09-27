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

  async updateStatus(id: number, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    const allowed = [
      "PENDING",
      "CONFIRMED",
      "SHIPPING",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!allowed.includes(status))
      throw new BadRequestException("Invalid order status");
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
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
