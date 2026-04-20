// src/jobs/workers/upload.worker.ts
import { Worker, Job } from "bullmq";
import { UploadJobData } from "../queues/upload.queue";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { prisma } from "../../lib/prisma";
import logger from "../../utils/logger";
import { getRedis } from "../../app/config/redis";

const redis = getRedis();

const processUploadJob = async (job: Job<UploadJobData>) => {
  const { fileBuffer, folder, productId, ownerId } = job.data;

  logger.info(`☁️ Processing upload job for product ${productId}`);

  // convert base64 back to Buffer
  const buffer = Buffer.from(fileBuffer as string, "base64");

  const result = await uploadToCloudinary(buffer, folder);

  await prisma.productImage.create({
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      productId,
    },
  });

  logger.info(`✅ Image uploaded for product ${productId}`);
  return { url: result.secure_url };
};

export const startUploadWorker = () => {
  const worker = new Worker<UploadJobData>("upload", processUploadJob, {
    connection: redis,
    concurrency: 3, // max 3 concurrent uploads
  });

  worker.on("completed", (job) =>
    logger.info(`✅ Upload job ${job.id} completed`)
  );
  worker.on("failed", (job, err) =>
    logger.error(`❌ Upload job ${job?.id} failed: ${err.message}`)
  );

  logger.info("✅ Upload worker started");
  return worker;
};