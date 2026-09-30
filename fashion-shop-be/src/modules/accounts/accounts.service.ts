import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAdminAccountDto } from "./dto/update-admin-account.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";

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
        phone: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        status: true,
        tier: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        },
      },
    });
    if (!user) throw new NotFoundException("Tài khoản không tồn tại");

    const ordersAgg = await this.prisma.order.aggregate({
      where: { userId: id, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { id: true },
    });

    return {
      ...user,
      totalSpent: Number(ordersAgg._sum.total || 0),
      ordersCount: ordersAgg._count.id || 0,
    };
  }

  async update(id: number, dto: UpdateAccountDto) {
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, id: { not: id } },
      });
      if (existingPhone) {
        throw new ConflictException("Số điện thoại này đã được sử dụng");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        gender: dto.gender as any,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        status: true,
        tier: true,
      },
    });
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Tài khoản không tồn tại");

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException("Mật khẩu hiện tại không chính xác");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Đổi mật khẩu thành công" };
  }

  async getSummary() {
    const [total, active, blocked, admins, staffs, customers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: "ACTIVE" } }),
        this.prisma.user.count({ where: { status: "BLOCKED" } }),
        this.prisma.user.count({ where: { role: "ADMIN" } }),
        this.prisma.user.count({ where: { role: "STAFF" } }),
        this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      ]);

    return {
      total,
      active,
      blocked,
      admins,
      staffs,
      customers,
    };
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
      ...(role ? { role: role as any } : {}),
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * take;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          gender: true,
          role: true,
          status: true,
          tier: true,
          notes: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { id: "desc" },
        skip,
        take,
      }),
    ]);

    // Format data with order count
    const data = users.map((u) => ({
      ...u,
      ordersCount: u._count?.orders || 0,
    }));

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

  async getDetail(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        status: true,
        tier: true,
        notes: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        },
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException("Tài khoản không tồn tại");

    const ordersAgg = await this.prisma.order.aggregate({
      where: { userId: id, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { id: true },
    });

    return {
      ...user,
      totalSpent: Number(ordersAgg._sum.total || 0),
      ordersCount: ordersAgg._count.id || 0,
    };
  }

  async create(dto: CreateAccountDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("Email này đã được sử dụng");

    if (dto.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException("Số điện thoại này đã được sử dụng");
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: (dto.role as any) || "STAFF",
        notes: dto.notes,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        tier: true,
        createdAt: true,
      },
    });

    return user;
  }

  async updateAdmin(id: number, dto: UpdateAdminAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Tài khoản không tồn tại");

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException("Số điện thoại này đã được sử dụng");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role as any,
        status: dto.status as any,
        tier: dto.tier as any,
        notes: dto.notes,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        tier: true,
        notes: true,
      },
    });
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: { id: true, email: true, status: true },
    });
  }

  // Address CRUD
  async getAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    });
  }

  async createAddress(userId: number, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Nếu đây là địa chỉ đầu tiên của user, tự động cho làm mặc định
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = count === 0 ? true : Boolean(dto.isDefault);

    return this.prisma.address.create({
      data: {
        userId,
        recipientName: dto.recipientName,
        phone: dto.phone,
        street: dto.street,
        ward: dto.ward,
        district: dto.district,
        city: dto.city,
        isDefault,
      },
    });
  }

  async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException("Địa chỉ không tồn tại");
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        recipientName: dto.recipientName,
        phone: dto.phone,
        street: dto.street,
        ward: dto.ward,
        district: dto.district,
        city: dto.city,
        isDefault: dto.isDefault,
      },
    });
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException("Địa chỉ không tồn tại");
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    // Nếu xóa địa chỉ mặc định, set địa chỉ còn lại gần nhất làm mặc định
    if (address.isDefault) {
      const nextAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { id: "desc" },
      });
      if (nextAddress) {
        await this.prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: "Đã xóa địa chỉ" };
  }

  async setDefaultAddress(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException("Địa chỉ không tồn tại");
    }

    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
