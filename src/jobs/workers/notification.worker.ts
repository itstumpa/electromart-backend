// src/jobs/workers/notification.worker.ts
import { Worker, Job } from "bullmq";
import { NotificationJobData } from "../queues/notification.queue";
import { prisma } from "../../lib/prisma";
import { sendNotificationToUser } from "../../socket/socket";
import { sendPushToUser } from "../../utils/sendPushNotification";
import logger from "../../utils/logger";
import { getRedis } from "../../app/config/redis";

const redis = getRedis();

const processNotificationJob = async (job: Job<NotificationJobData>) => {
  const { userId, title, message, type, sendPush, sendSocket } = job.data;

  // save to DB
  await prisma.notification.create({ data: { userId, title, message, type } });

  // real-time socket
  if (sendSocket !== false) {
    sendNotificationToUser(userId, { title, message, type });
  }

  // push notification
  if (sendPush !== false) {
    await sendPushToUser(userId, { title, message, type }).catch(() => {});
  }

  logger.info(`✅ Notification sent to user ${userId}: ${type}`);
};

export const startNotificationWorker = () => {
  const worker = new Worker<NotificationJobData>(
    "notification",
    processNotificationJob,
    { connection: redis, concurrency: 10 }
  );

  worker.on("failed", (job, err) =>
    logger.error(`❌ Notification job ${job?.id} failed: ${err.message}`)
  );

  logger.info("✅ Notification worker started");
  return worker;
};