// src/app/modules/notification/notification.service.ts
import { prisma } from "../../../lib/prisma";
import { sendNotificationToUser } from "../../../socket/socket";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
}

// create DB record + emit real-time
export const createNotification = async (data: CreateNotificationInput) => {
  const notification = await prisma.notification.create({ data });

  // fire and forget real-time emit
  sendNotificationToUser(data.userId, {
    title: data.title,
    message: data.message,
    type: data.type,
  });

  return notification;
};

// GET all notifications for a user
export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50, // last 50
  });
};

// MARK single as read
export const markAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

// MARK ALL as read
export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

// unread count badge
export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount: count };
};