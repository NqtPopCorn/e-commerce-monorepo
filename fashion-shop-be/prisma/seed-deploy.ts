import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding deploy data (essential accounts)...");

  // Tạo tài khoản Admin mặc định để deploy
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fahasa.com";
  const rawPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "System",
      role: "ADMIN",
    },
  });

  console.log(`Created default admin account: ${adminEmail}`);
  console.log("Deploy seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
