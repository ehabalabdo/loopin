"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getClients() {
  await requireRole(["MANAGER", "ACCOUNTANT"]);
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invoices: { select: { id: true, status: true, remainingAmount: true } },
    },
  });
  return clients.map((c) => ({
    ...c,
    amount: Number(c.amount),
    invoices: c.invoices.map((i) => ({ ...i, remainingAmount: Number(i.remainingAmount) })),
  }));
}

export async function createClient(formData: FormData) {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = (formData.get("email") as string) || undefined;
  const serviceType = formData.get("serviceType") as "SOCIAL_MEDIA" | "VIDEO";
  const subscriptionType = formData.get("subscriptionType") as string | null;
  const amount = parseFloat(formData.get("amount") as string);
  const startDate = formData.get("startDate") as string;
  const notes = (formData.get("notes") as string) || undefined;

  let endDate: Date | undefined;
  if (startDate && subscriptionType) {
    const start = new Date(startDate);
    const months: Record<string, number> = {
      MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12,
    };
    endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + (months[subscriptionType] || 1));
  }

  await prisma.client.create({
    data: {
      name,
      phone,
      email,
      serviceType,
      subscriptionType: subscriptionType as "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL" | undefined,
      amount,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate,
      notes,
    },
  });

  revalidatePath("/clients");
}

export async function updateClient(id: string, formData: FormData) {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = (formData.get("email") as string) || undefined;
  const serviceType = formData.get("serviceType") as "SOCIAL_MEDIA" | "VIDEO";
  const subscriptionType = formData.get("subscriptionType") as string | null;
  const amount = parseFloat(formData.get("amount") as string);
  const isActive = formData.get("isActive") === "true";
  const notes = (formData.get("notes") as string) || undefined;

  await prisma.client.update({
    where: { id },
    data: {
      name,
      phone,
      email,
      serviceType,
      subscriptionType: subscriptionType as "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL" | undefined,
      amount,
      isActive,
      notes,
    },
  });

  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  await requireRole(["MANAGER"]);
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
}
