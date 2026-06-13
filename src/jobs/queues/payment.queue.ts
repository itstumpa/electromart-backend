// src/jobs/queues/payment.queue.ts
import { Queue } from "bullmq";
import { getBullConnection } from "../../app/config/redis";

export const paymentQueue = new Queue("payment", {
  connection: getBullConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export type PaymentJobData =
  | { type: "INITIATE_SSLCOMMERZ"; orderId: string; customerId: string }
  | { type: "INITIATE_STRIPE";     orderId: string; customerId: string }
  | { type: "CONFIRM_PAYMENT";     orderId: string; transactionId: string; gatewayResponse: any }
  | { type: "PROCESS_REFUND";      orderId: string; reason: string };