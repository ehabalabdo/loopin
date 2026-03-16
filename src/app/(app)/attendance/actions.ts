"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// جلب سجل الحضور اليومي للموظف الحالي
export async function getTodayAttendance() {
  const session = await requireAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.attendance.findFirst({
    where: {
      userId: session.id,
      checkIn: { gte: today, lt: tomorrow },
    },
    orderBy: { checkIn: "desc" },
  });
}

// تسجيل الدخول
export async function checkIn() {
  const session = await requireAuth();
  const existing = await getTodayAttendance();
  if (existing) throw new Error("لقد سجلت دخولك مسبقاً اليوم");

  await prisma.attendance.create({
    data: {
      userId: session.id,
      checkIn: new Date(),
      status: "PRESENT",
    },
  });
  revalidatePath("/attendance");
}

// بداية الاستراحة
export async function breakOut() {
  const session = await requireAuth();
  const attendance = await getTodayAttendance();
  if (!attendance) throw new Error("لم تسجل دخولك بعد");
  if (attendance.breakStart) throw new Error("أنت بالفعل في استراحة");

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: { breakStart: new Date() },
  });
  revalidatePath("/attendance");
}

// نهاية الاستراحة
export async function breakIn() {
  const session = await requireAuth();
  const attendance = await getTodayAttendance();
  if (!attendance || !attendance.breakStart) throw new Error("لم تبدأ استراحة");
  if (attendance.breakEnd) throw new Error("انتهت الاستراحة مسبقاً");

  const breakStart = new Date(attendance.breakStart);
  const now = new Date();
  const breakHours = (now.getTime() - breakStart.getTime()) / (1000 * 60 * 60);

  // إذا تجاوزت الاستراحة 3 ساعات - خصم إجازة
  let status = attendance.status;
  if (breakHours > 3) {
    status = "LEAVE";
  }

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: { breakEnd: now, status },
  });
  revalidatePath("/attendance");
}

// تسجيل الخروج (يتطلب تقرير يومي)
export async function checkOut(formData: FormData) {
  const session = await requireAuth();
  const attendance = await getTodayAttendance();
  if (!attendance) throw new Error("لم تسجل دخولك بعد");
  if (attendance.checkOut) throw new Error("سجلت خروجك مسبقاً");

  const report = formData.get("report") as string;
  if (!report || report.trim().length < 10) {
    throw new Error("يجب كتابة تقرير يومي (10 أحرف على الأقل)");
  }

  const checkIn = new Date(attendance.checkIn);
  const now = new Date();
  let totalMinutes = (now.getTime() - checkIn.getTime()) / (1000 * 60);

  // طرح وقت الاستراحة
  if (attendance.breakStart && attendance.breakEnd) {
    const breakMinutes =
      (new Date(attendance.breakEnd).getTime() - new Date(attendance.breakStart).getTime()) / (1000 * 60);
    totalMinutes -= breakMinutes;
  }

  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  await prisma.$transaction([
    prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: now, totalHours },
    }),
    prisma.dailyReport.create({
      data: {
        userId: session.id,
        content: report,
        date: new Date(),
      },
    }),
  ]);

  revalidatePath("/attendance");
}

// جلب سجل الحضور (للمدير - جميع الموظفين، للموظف - خاص به)
export async function getAttendanceHistory(month?: number, year?: number) {
  const session = await requireAuth();
  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 1);

  const where: Record<string, unknown> = {
    checkIn: { gte: startDate, lt: endDate },
  };

  if (session.role !== "MANAGER") {
    where.userId = session.id;
  }

  return prisma.attendance.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { checkIn: "desc" },
  });
}
