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
