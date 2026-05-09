// src/jobs/workers/payment.worker.ts
import { Worker, Job } from "bullmq";
import { PaymentJobData } from "../queues/payment.queue";
import { prisma } from "../../lib/prisma";
import { emailQueue } from "../queues/email.queue";
import { notificationQueue } from "../queues/notification.queue";
import logger from "../../utils/logger";
import { getRedis } from "../../app/config/redis";

const redis = getRedis();

const processPaymentJob = async (job: Job<PaymentJobData>) => {
  const data = job.data;

  if (data.type === "CONFIRM_PAYMENT") {
    const { orderId, transactionId, gatewayResponse } = data;

    // idempotent check
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status === "PAID") return;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: { status: "PAID", transactionId, gatewayResponse },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
      });
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (order) {
      // queue email + notification
      await emailQueue.add("payment-confirmed", {
        type: "PAYMENT_CONFIRMED",
        to: order.user.email,
        customerName: order.user.name,
        orderId,
        amount: Number(order.total.toFixed(2)),
        transactionId,
      });

      await notificationQueue.add("payment-confirmed", {
        userId: order.userId,
        title: "Payment Successful",
        message: `Payment confirmed for order #${orderId.slice(-6).toUpperCase()}`,
        type: "PAYMENT_CONFIRMED",
      });
    }

    logger.info(`✅ Payment confirmed for order ${orderId}`);
  }
};

export const startPaymentWorker = () => {
  const worker = new Worker<PaymentJobData>(
    "payment",
    processPaymentJob,
    { connection: redis, concurrency: 2 }
  );

  worker.on("failed", (job, err) =>
    logger.error(`❌ Payment job ${job?.id} failed: ${err.message}`)
  );

  logger.info("✅ Payment worker started");
  return worker;
};