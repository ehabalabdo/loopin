import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(import.meta.dirname || __dirname, "..", ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🗑️  جاري مسح جميع البيانات...\n");

  // مسح البيانات بالترتيب الصحيح (الجداول التابعة أولاً)
  const deleted = await prisma.$transaction([
    prisma.newsRead.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.dailyReport.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.warning.deleteMany(),
    prisma.deduction.deleteMany(),
    prisma.payslip.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.news.deleteMany(),
    prisma.client.deleteMany(),
    prisma.workSchedule.deleteMany(),
    prisma.user.deleteMany(),
    prisma.settings.deleteMany(),
  ]);

  const tables = [
    "NewsRead", "Notification", "DailyReport", "Attendance",
    "LeaveRequest", "Warning", "Deduction", "Payslip",
    "Payment", "Invoice", "Expense", "News",
    "Client", "WorkSchedule", "User", "Settings",
  ];

  deleted.forEach((result, i) => {
    if (result.count > 0) {
      console.log(`   ✅ ${tables[i]}: تم مسح ${result.count} سجل`);
    }
  });

  console.log("\n✅ تم مسح جميع البيانات بنجاح!");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ خطأ:", e);
  process.exit(1);
});
