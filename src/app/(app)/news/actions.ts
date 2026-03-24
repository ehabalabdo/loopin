"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function getNews() {
  await requireAuth();
  return prisma.news.findMany({
    include: {
      author: { select: { name: true } },
      reads: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNews(formData: FormData) {
  const session = await requireRole(["MANAGER"]);

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const mediaUrl = formData.get("mediaUrl") as string | null;
  const mediaType = formData.get("mediaType") as string | null;

  const news = await prisma.news.create({
    data: {
      title,
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      authorId: session.id,
    },
  });

  // إشعار جميع الموظفين
  const employees = await prisma.user.findMany({
    where: { isActive: true, id: { not: session.id } },
  });

  for (const emp of employees) {
    await createNotification({
      userId: emp.id,
      title: "خبر جديد",
      message: title,
      type: "news",
    });
  }

  revalidatePath("/news");
  return news;
}

export async function markAsRead(newsId: string) {
  const session = await requireAuth();

  const existing = await prisma.newsRead.findFirst({
    where: { newsId, userId: session.id },
  });

  if (!existing) {
    await prisma.newsRead.create({
      data: { newsId, userId: session.id },
    });
  }

  revalidatePath("/news");
}

export async function deleteNews(id: string) {
  await requireRole(["MANAGER"]);
  await prisma.news.delete({ where: { id } });
  revalidatePath("/news");
}
