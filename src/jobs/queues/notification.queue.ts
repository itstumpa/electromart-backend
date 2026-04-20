// src/jobs/queues/notification.queue.ts
import { Queue } from "bullmq";
import { getRedis } from "../../app/config/redis";

const redis = getRedis();;

export const notificationQueue = new Queue("notification", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 50,
  },
});

export type NotificationJobData = {
  userId: string;
  title: string;
  message: string;
  type: string;
  sendPush?: boolean;
  sendSocket?: boolean;
};