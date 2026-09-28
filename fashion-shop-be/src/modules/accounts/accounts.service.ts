import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateAccountDto } from "./dto/update-account.dto";
@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}
  async me(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("Account not found");
    return user;
  }
  update(id: number, dto: UpdateAccountDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit, search, role, status } = query || {};

    const where: any = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * take;

      const [total, data] = await Promise.all([
        (this.prisma.user as any).count({ where }),
        (this.prisma.user as any).findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: { id: "desc" },
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

    return (this.prisma.user as any).findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { id: "desc" },
    });
  }

  updateStatus(id: number, status: string) {
    return (this.prisma.user as any).update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }
}
