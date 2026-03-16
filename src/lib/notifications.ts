import { prisma } from "./db";
import { sendNotificationEmail } from "./email";

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({
    data: { userId, title, message, type, link, isRead: false },
  });

  // إرسال إيميل
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendNotificationEmail(user.email, title, message);
  }

  return notification;
}
