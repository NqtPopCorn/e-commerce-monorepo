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

  findAll() {
    return (this.prisma.user as any).findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { id: "asc" },
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
