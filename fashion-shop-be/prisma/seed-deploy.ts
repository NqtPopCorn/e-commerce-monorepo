import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding deploy data (essential accounts)...");

  // 1. Tạo tài khoản Admin mặc định
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fashionshop.com";
  const rawPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      phone: "0901234567",
      tier: "DIAMOND",
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "System",
      phone: "0901234567",
      role: "ADMIN",
      tier: "DIAMOND",
      notes: "Tài khoản quản trị viên tối cao",
    },
  });

  // 2. Tạo tài khoản Staff mặc định
  const staffEmail = "staff@fashionshop.com";
  const staffPassword = await bcrypt.hash("staff123", 10);

  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      password: staffPassword,
      role: "STAFF",
      phone: "0902345678",
    },
    create: {
      email: staffEmail,
      password: staffPassword,
      firstName: "Nhân viên",
      lastName: "Vận hành",
      phone: "0902345678",
      role: "STAFF",
      notes: "Nhân viên xử lý đơn hàng và kho thời trang",
    },
  });

  // 3. Tạo tài khoản Customer mẫu
  const userHashedPassword = await bcrypt.hash("user123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "user@fashionshop.com" },
    update: {
      password: userHashedPassword,
      role: "CUSTOMER",
      phone: "0903456789",
      gender: "FEMALE",
      tier: "SILVER",
    },
    create: {
      email: "user@fashionshop.com",
      password: userHashedPassword,
      firstName: "Khách",
      lastName: "Hàng Mẫu",
      phone: "0903456789",
      role: "CUSTOMER",
      gender: "FEMALE",
      tier: "SILVER",
      notes: "Khách hàng thân thiết, thường chọn size M",
    },
  });

  // Tạo địa chỉ mẫu cho customer
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        recipientName: "Khách Hàng Mẫu",
        phone: "0903456789",
        street: "Tầng 5, Tòa nhà Landmark 81, 720A Điện Biên Phủ",
        ward: "Phường 22",
        district: "Quận Bình Thạnh",
        city: "Hồ Chí Minh",
        isDefault: true,
      },
    });
  }

  // 4. Seed initial Audit Logs if empty
  const auditLogsCount = await prisma.auditLog.count();
  if (auditLogsCount === 0) {
    const now = new Date();
    await prisma.auditLog.createMany({
      data: [
        {
          userId: admin.id,
          userEmail: admin.email,
          userRole: admin.role,
          action: "SYSTEM_INITIALIZE",
          entityType: "SYSTEM",
          entityId: "SYSTEM-01",
          description:
            "Khởi tạo hệ thống Fashion Shop v2 và cấu hình cơ sở dữ liệu ban đầu",
          ipAddress: "127.0.0.1",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
          status: "SUCCESS",
          createdAt: new Date(now.getTime() - 3 * 3600 * 1000),
        },
        {
          userId: admin.id,
          userEmail: admin.email,
          userRole: admin.role,
          action: "LOGIN_SUCCESS",
          entityType: "AUTH",
          entityId: String(admin.id),
          description: `Đăng nhập thành công với vai trò ${admin.role} (${admin.email})`,
          ipAddress: "192.168.1.15",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
          status: "SUCCESS",
          createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
        },
        {
          userId: staff.id,
          userEmail: staff.email,
          userRole: staff.role,
          action: "PURCHASE_RECEIPT_CREATE",
          entityType: "PURCHASE",
          entityId: "1",
          description:
            "Tạo phiếu nhập kho #PN-20260930-1001 (Tổng: 15.000.000 ₫, 12 mặt hàng)",
          newValue: {
            code: "PN-20260930-1001",
            supplier: "Fashion Shop Official",
            totalAmount: 15000000,
            itemsCount: 12,
          },
          ipAddress: "192.168.1.20",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
          status: "SUCCESS",
          createdAt: new Date(now.getTime() - 90 * 60 * 1000),
        },
        {
          userId: admin.id,
          userEmail: admin.email,
          userRole: admin.role,
          action: "ORDER_STATUS_UPDATE",
          entityType: "ORDER",
          entityId: "1",
          description: "Cập nhật đơn hàng #1: trạng thái [PENDING ➔ CONFIRMED]",
          oldValue: { status: "PENDING", paymentStatus: "UNPAID" },
          newValue: { status: "CONFIRMED", paymentStatus: "UNPAID" },
          ipAddress: "192.168.1.15",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
          status: "SUCCESS",
          createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        },
        {
          userId: admin.id,
          userEmail: admin.email,
          userRole: admin.role,
          action: "PROMOTION_CREATE",
          entityType: "PROMOTION",
          entityId: "1",
          description: "Tạo chương trình khuyến mãi: Khai Trương Mùa Thu 2026",
          newValue: {
            name: "Khai Trương Mùa Thu 2026",
            applicationType: "AUTO",
            budgetLimit: 50000000,
          },
          ipAddress: "192.168.1.15",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
          status: "SUCCESS",
          createdAt: new Date(now.getTime() - 20 * 60 * 1000),
        },
        {
          userEmail: "unknown_hacker@bad.net",
          action: "LOGIN_FAILED",
          entityType: "AUTH",
          description:
            "Đăng nhập thất bại: Tài khoản không tồn tại (unknown_hacker@bad.net)",
          ipAddress: "45.134.14.89",
          userAgent: "curl/7.88.1",
          status: "FAILED",
          errorMessage: "Invalid credentials",
          createdAt: new Date(now.getTime() - 10 * 60 * 1000),
        },
      ],
    });
    console.log("Seeded initial sample audit logs");
  }

  console.log(
    `Created default admin account: ${adminEmail} (password: ${rawPassword})`,
  );
  console.log(
    `Created default staff account: ${staffEmail} (password: staff123)`,
  );
  console.log(
    `Created default customer account: user@fashionshop.com (password: user123)`,
  );
  console.log("Deploy seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
