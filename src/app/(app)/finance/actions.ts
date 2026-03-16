"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getFinanceData() {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const [invoices, expenses, clients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, phone: true } },
        payments: true,
      },
    }),
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      clientPhone: inv.client.phone,
      clientId: inv.clientId,
      amount: Number(inv.amount),
      paidAmount: Number(inv.paidAmount),
      remainingAmount: Number(inv.remainingAmount),
      status: inv.status,
      description: inv.description,
      dueDate: inv.dueDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        paidAt: p.paidAt.toISOString(),
      })),
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
      date: e.date.toISOString(),
    })),
    clients,
  };
}

export async function createInvoice(formData: FormData) {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const clientId = formData.get("clientId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;

  // رقم فاتورة تسلسلي
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });
  const lastNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.replace("INV-", "")) : 0;
  const invoiceNumber = `INV-${String(lastNum + 1).padStart(5, "0")}`;

  await prisma.invoice.create({
    data: {
      clientId,
      invoiceNumber,
      amount,
      remainingAmount: amount,
      description,
      dueDate: new Date(dueDate),
    },
  });

  revalidatePath("/finance");
}

export async function addPayment(formData: FormData) {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const invoiceId = formData.get("invoiceId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as "CASH" | "BANK_TRANSFER" | "CHECK" | "CLIQ";
  const reference = (formData.get("reference") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const newPaidAmount = Number(invoice.paidAmount) + amount;
  const newRemaining = Number(invoice.amount) - newPaidAmount;
  const newStatus = newRemaining <= 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING";

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        clientId: invoice.clientId,
        amount,
        method,
        reference,
        notes,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemaining),
        status: newStatus,
      },
    }),
  ]);

  revalidatePath("/finance");
}

export async function createExpense(formData: FormData) {
  await requireRole(["MANAGER", "ACCOUNTANT"]);

  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;

  await prisma.expense.create({
    data: {
      category: category as "SALARIES" | "RENT" | "SUBSCRIPTIONS" | "UTILITIES" | "MISCELLANEOUS" | "GOVERNMENT" | "EQUIPMENT",
      amount,
      description,
      date: new Date(date),
    },
  });

  revalidatePath("/finance");
}

export async function deleteExpense(id: string) {
  await requireRole(["MANAGER"]);
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/finance");
}
