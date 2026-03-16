"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function getDashboardData() {
  const session = await requireAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // إيرادات الشهر
  const monthlyPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      paidAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // مصاريف الشهر
  const monthlyExpenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // فواتير غير مدفوعة
  const unpaidInvoices = await prisma.invoice.count({
    where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
  });

  // عملاء نشطين
  const activeClients = await prisma.client.count({
    where: { isActive: true },
  });

  // الموظفين النشطين
  const activeEmployees = await prisma.user.count({
    where: { isActive: true },
  });

  // إجازات معلقة
  const pendingLeaves = await prisma.leaveRequest.count({
    where: { status: "PENDING" },
  });

  // آخر 5 دفعات
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { paidAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  // فواتير متأخرة
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lt: now },
    },
    include: { client: { select: { name: true, phone: true } } },
    take: 5,
  });

  return {
    role: session.role,
    monthlyRevenue: Number(monthlyPayments._sum.amount ?? 0),
    monthlyExpenses: Number(monthlyExpenses._sum.amount ?? 0),
    unpaidInvoices,
    activeClients,
    activeEmployees,
    pendingLeaves,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      clientName: p.client.name,
      amount: Number(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
    })),
    overdueInvoices: overdueInvoices.map((inv) => ({
      id: inv.id,
      clientName: inv.client.name,
      clientPhone: inv.client.phone,
      amount: Number(inv.amount),
      remaining: Number(inv.remainingAmount),
      dueDate: inv.dueDate.toISOString(),
    })),
  };
}
