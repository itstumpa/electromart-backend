// src/app/modules/notification/notification.service.ts
import { Role } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { sendNotificationToUser } from "../../../socket/socket";
import ApiError from "../../../utils/apiErrors";
import { sendEmail } from "../../../utils/sendEmail";
import { sendPushToUser } from "../../../utils/sendPushNotification";


interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
}
interface SendNotificationPayload {
  targetType: "USER" | "USERS" | "ROLE" | "ALL_USERS";
  userId?: string;
  userIds?: string[];
  role?: Role;
  title: string;
  message: string;
  type?: string;
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

   // push notification (browser even when closed)
  await sendPushToUser(data.userId, {
    title: data.title,
    message: data.message,
    type: data.type,
  }).catch(() => {}); // silent fail — push is best effort


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

export const sendManualNotification = async (
  payload: SendNotificationPayload,
) => {
  let users: {
    id: string;
    email: string;
    name: string;
    emailNotificationEnabled: boolean;
  }[] = [];

  // USER
  if (payload.targetType === "USER") {
    if (!payload.userId) {
      throw new ApiError(400, "userId is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotificationEnabled: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    users = [user];
  }

  // USERS
  else if (payload.targetType === "USERS") {
    if (!payload.userIds || payload.userIds.length === 0) {
      throw new ApiError(400, "userIds are required");
    }

    users = await prisma.user.findMany({
      where: {
        id: {
          in: payload.userIds,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotificationEnabled: true,
      },
    });
  }

  // ROLE
  else if (payload.targetType === "ROLE") {
    if (!payload.role) {
      throw new ApiError(400, "role is required");
    }

    users = await prisma.user.findMany({
      where: {
        role: payload.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotificationEnabled: true,
      },
    });
  }

  // ALL USERS
  else if (payload.targetType === "ALL_USERS") {
    users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailNotificationEnabled: true,
      },
    });
  }

  if (users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  // bulk insert DB notifications
  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: payload.title,
      message: payload.message,
      type: payload.type || "ADMIN_NOTIFICATION",
    })),
  });

  // realtime + email
  for (const user of users) {
    sendNotificationToUser(user.id, {
      title: payload.title,
      message: payload.message,
      type: payload.type || "ADMIN_NOTIFICATION",
    });

    if (user.emailNotificationEnabled) {
      await sendEmail({
        to: user.email,
        subject: payload.title,
        html: `
          <h2>${payload.title}</h2>
          <p>Hello ${user.name}</p>
          <p>${payload.message}</p>
        `,
      });
    }
  }

  return {
    totalUsers: users.length,
    targetType: payload.targetType,
  };
};


export const testNotification = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailNotificationEnabled: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const notification = await createNotification({
    userId,
    title: "Test Notification",
    message: "This is a test notification",
    type: "TEST_NOTIFICATION",
  });
if (user.emailNotificationEnabled) {
    await sendEmail({
      to: user.email,
      subject: "Test Notification",
      html: `
        <h2>Hello ${user.name}</h2>
        <p>This is a test email notification.</p>
      `,
    });
  }

  return notification;
};

export const toggleEmailNotification = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailNotificationEnabled: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      emailNotificationEnabled: !user.emailNotificationEnabled,
    },
    select: {
      id: true,
      emailNotificationEnabled: true,
    },
  });

  return updatedUser;
};
