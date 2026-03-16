"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function getLeaves() {
  const session = await requireAuth();

  if (session.role === "MANAGER") {
    return prisma.leaveRequest.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.leaveRequest.findMany({
    where: { userId: session.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestLeave(formData: FormData) {
  const session = await requireAuth();

  const type = formData.get("type") as "ANNUAL" | "SICK" | "UNPAID";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: session.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });

  // إشعار المدير
  const managers = await prisma.user.findMany({ where: { role: "MANAGER", isActive: true } });
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const typeLabels = { ANNUAL: "سنوية", SICK: "مرضية", UNPAID: "بدون راتب" };

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      title: "طلب إجازة جديد",
      message: `${user?.name} يطلب إجازة ${typeLabels[type]} من ${startDate} إلى ${endDate}`,
      type: "leave",
    });
  }

  revalidatePath("/leaves");
  return leave;
}

export async function updateLeaveStatus(leaveId: string, status: "APPROVED" | "REJECTED") {
  await requireRole(["MANAGER"]);

  const leave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status },
  });

  const statusLabel = status === "APPROVED" ? "تمت الموافقة" : "تم الرفض";
  await createNotification({
    userId: leave.userId,
    title: `${statusLabel} على طلب الإجازة`,
    message: `طلب الإجازة الخاص بك من ${leave.startDate.toLocaleDateString("ar-JO")} إلى ${leave.endDate.toLocaleDateString("ar-JO")} - ${statusLabel}`,
    type: "leave",
  });

  revalidatePath("/leaves");
}
