"use server";

import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  if (!user.isActive) {
    return { error: "الحساب معطّل، تواصل مع المدير" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}
