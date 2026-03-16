"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";

export async function getEmployees() {
  await requireRole(["MANAGER"]);
  const employees = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { workSchedule: true },
  });
  return employees.map((e) => ({ ...e, salary: Number(e.salary) }));
}

export async function createEmployee(formData: FormData) {
  await requireRole(["MANAGER"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = (formData.get("phone") as string) || undefined;
  const role = formData.get("role") as "MANAGER" | "ACCOUNTANT" | "EMPLOYEE";
  const salary = parseFloat(formData.get("salary") as string);
  const workType = formData.get("workType") as string;
  const timezone = formData.get("timezone") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  const hashedPassword = await bcrypt.hash(password, 12);

  const workDays = {
    sunday: formData.get("sunday") === "on",
    monday: formData.get("monday") === "on",
    tuesday: formData.get("tuesday") === "on",
    wednesday: formData.get("wednesday") === "on",
    thursday: formData.get("thursday") === "on",
    friday: formData.get("friday") === "on",
    saturday: formData.get("saturday") === "on",
  };

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      salary,
      workType,
      timezone,
      workSchedule: {
        create: {
          ...workDays,
          startTime: startTime || "09:00",
          endTime: endTime || "17:00",
        },
      },
    },
  });

  revalidatePath("/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  await requireRole(["MANAGER"]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || undefined;
  const role = formData.get("role") as "MANAGER" | "ACCOUNTANT" | "EMPLOYEE";
  const salary = parseFloat(formData.get("salary") as string);
  const workType = formData.get("workType") as string;
  const timezone = formData.get("timezone") as string;
  const isActive = formData.get("isActive") === "true";

  await prisma.user.update({
    where: { id },
    data: { name, email, phone, role, salary, workType, timezone, isActive },
  });

  revalidatePath("/employees");
}

export async function sendWarning(formData: FormData) {
  await requireRole(["MANAGER"]);

  const userId = formData.get("userId") as string;
  const type = formData.get("type") as "NOTICE" | "WARNING" | "DEDUCTION";
  const reason = formData.get("reason") as string;
  const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : undefined;

  await prisma.warning.create({
    data: { userId, type, reason, amount },
  });

  // إضافة خصم إذا كان النوع خصم
  if (type === "DEDUCTION" && amount) {
    const now = new Date();
    await prisma.deduction.create({
      data: {
        userId,
        amount,
        reason,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });
  }

  const typeLabels = { NOTICE: "تنبيه", WARNING: "إنذار", DEDUCTION: "خصم" };
  await createNotification({
    userId,
    title: `${typeLabels[type]} جديد`,
    message: reason + (amount ? ` - مبلغ الخصم: ${amount} د.أ` : ""),
    type: "warning",
  });

  revalidatePath("/employees");
}

export async function deleteEmployee(id: string) {
  await requireRole(["MANAGER"]);
  await prisma.user.delete({ where: { id } });
  revalidatePath("/employees");
}
