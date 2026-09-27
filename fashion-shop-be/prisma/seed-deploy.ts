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

  // Tạo tài khoản Admin mặc định để deploy
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fashionshop.com";
  const rawPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "System",
      role: "ADMIN",
    },
  });

  // Tạo tài khoản Customer mẫu để test
  const userHashedPassword = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "user@fashionshop.com" },
    update: {
      password: userHashedPassword,
      role: "CUSTOMER",
    },
    create: {
      email: "user@fashionshop.com",
      password: userHashedPassword,
      firstName: "Khách",
      lastName: "Hàng Mẫu",
      role: "CUSTOMER",
    },
  });

  console.log(`Created default admin account: ${adminEmail} (password: ${rawPassword})`);
  console.log(`Created default customer account: user@fashionshop.com (password: user123)`);
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
