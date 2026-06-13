// src/jobs/queues/upload.queue.ts
import { Queue } from "bullmq";
import { getBullConnection } from "../../app/config/redis";

export const uploadQueue = new Queue("upload", {
  connection: getBullConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export type UploadJobData = {
  fileBuffer: Buffer | string; // base64 string for queue serialization
  folder: string;
  productId: string;
  ownerId: string;
};