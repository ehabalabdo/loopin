"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  await requireRole(["MANAGER"]);
  return prisma.settings.findFirst();
}

export async function updateSettings(formData: FormData) {
  await requireRole(["MANAGER"]);

  const companyName = formData.get("companyName") as string;
  const companyEmail = formData.get("companyEmail") as string;
  const companyPhone = (formData.get("companyPhone") as string) || undefined;
  const efatooraApiKey = (formData.get("efatooraApiKey") as string) || undefined;

  const existing = await prisma.settings.findFirst();

  if (existing) {
    await prisma.settings.update({
      where: { id: existing.id },
      data: { companyName, companyEmail, companyPhone, efatooraApiKey },
    });
  } else {
    await prisma.settings.create({
      data: { companyName, companyEmail, companyPhone, efatooraApiKey },
    });
  }

  revalidatePath("/settings");
}
