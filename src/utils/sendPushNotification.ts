// src/utils/sendPushNotification.ts
import webPush from "../app/config/webPush";
import { prisma } from "../lib/prisma";

export const sendPushToUser = async (
  userId: string,
  payload: { title: string; message: string; type: string }
) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.message,
    icon: "/icons/logo.png",
    badge: "/icons/badge.png",
    data: { type: payload.type },
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload
        );
      } catch (err: any) {
        // subscription expired — remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
};