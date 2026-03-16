"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPayrollData(month: number, year: number) {
  const session = await requireAuth();

  const users = session.role === "MANAGER"
    ? await prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
    : await prisma.user.findMany({ where: { id: session.id } });

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const payroll = await Promise.all(
    users.map(async (user) => {
      const deductions = await prisma.deduction.findMany({
        where: { userId: user.id, month, year },
      });

      const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

      const attendance = await prisma.attendance.findMany({
        where: { userId: user.id, checkIn: { gte: startDate, lt: endDate } },
      });

      const workingDays = attendance.filter((a) => a.status === "PRESENT").length;
      const totalHours = attendance.reduce((sum, a) => sum + Number(a.totalHours || 0), 0);

      const existingPayslip = await prisma.payslip.findFirst({
        where: { userId: user.id, month, year },
      });

      return {
        user: { id: user.id, name: user.name, email: user.email, salary: Number(user.salary) },
        workingDays,
        totalHours: Math.round(totalHours * 100) / 100,
        deductions: deductions.map((d) => ({ id: d.id, amount: Number(d.amount), reason: d.reason })),
        totalDeductions,
        netSalary: Number(user.salary) - totalDeductions,
        payslip: existingPayslip,
      };
    })
  );

  return payroll;
}

export async function generatePayslip(userId: string, month: number, year: number) {
  await requireRole(["MANAGER"]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("موظف غير موجود");

  const deductions = await prisma.deduction.findMany({
    where: { userId, month, year },
  });
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  const netSalary = Number(user.salary) - totalDeductions;

  const existing = await prisma.payslip.findFirst({
    where: { userId, month, year },
  });

  if (existing) {
    await prisma.payslip.update({
      where: { id: existing.id },
      data: { baseSalary: user.salary, deductions: totalDeductions, netSalary },
    });
  } else {
    await prisma.payslip.create({
      data: { userId, month, year, baseSalary: user.salary, deductions: totalDeductions, netSalary },
    });
  }

  revalidatePath("/payroll");
}

export async function generateAllPayslips(month: number, year: number) {
  await requireRole(["MANAGER"]);

  const users = await prisma.user.findMany({ where: { isActive: true } });

  for (const user of users) {
    await generatePayslip(user.id, month, year);
  }

  revalidatePath("/payroll");
}

export async function markPayslipPaid(payslipId: string) {
  await requireRole(["MANAGER"]);

  await prisma.payslip.update({
    where: { id: payslipId },
    data: { isPaid: true, paidAt: new Date() },
  });

  revalidatePath("/payroll");
}
