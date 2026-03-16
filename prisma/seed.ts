import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 بدء إعداد البيانات الأولية...");

  // إنشاء حساب المدير
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const manager = await prisma.user.upsert({
    where: { email: "admin@loop.jo" },
    update: {},
    create: {
      name: "إيهاب",
      email: "admin@loop.jo",
      password: hashedPassword,
      role: "MANAGER",
      salary: 0,
      workType: "ONSITE",
      timezone: "Asia/Amman",
      workSchedule: {
        create: {
          sunday: true,
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: false,
          saturday: false,
          startTime: "09:00",
          endTime: "17:00",
        },
      },
    },
  });

  console.log(`✅ تم إنشاء حساب المدير: ${manager.email}`);

  // إنشاء إعدادات الشركة
  const settings = await prisma.settings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      companyName: "شركة لوب للدعاية والإعلان",
      companyEmail: "info@loop.jo",
    },
  });

  console.log(`✅ تم إنشاء إعدادات الشركة: ${settings.companyName}`);
  console.log("");
  console.log("📋 بيانات تسجيل الدخول:");
  console.log("   البريد: admin@loop.jo");
  console.log("   كلمة المرور: admin123");
  console.log("");
  console.log("⚠️  يرجى تغيير كلمة المرور بعد أول تسجيل دخول!");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
