import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { code: string; variantId: number; quantity: number }) {
    const batch = await this.prisma.batch.create({
      data: {
        code: data.code,
        variantId: data.variantId,
        quantity: data.quantity,
      },
    });

    // Tăng tồn kho variant
    await this.prisma.bookVariant.update({
      where: { id: data.variantId },
      data: { stock: { increment: data.quantity } },
    });

    return batch;
  }

  findAll() {
    return this.prisma.batch.findMany({
      include: { variant: { include: { book: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
