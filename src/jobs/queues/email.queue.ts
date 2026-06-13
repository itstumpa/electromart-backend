// src/jobs/queues/email.queue.ts
import { Queue } from "bullmq";
import { getBullConnection } from "../../app/config/redis";

export const emailQueue = new Queue("email", {
  connection: getBullConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// job types
export type EmailJobData =
  | { type: "ORDER_CONFIRMED";    to: string; customerName: string; orderId: string; totalAmount: number; items: any[] }
  | { type: "NEW_ORDER_VENDOR";   to: string; vendorName: string; storeName: string; orderId: string; items: any[] }
  | { type: "ORDER_STATUS";       to: string; customerName: string; orderId: string; status: string }
  | { type: "RETURN_REQUESTED";   to: string; vendorName: string; productName: string; reason: string }
  | { type: "RETURN_RESOLVED";    to: string; customerName: string; productName: string; status: string; note?: string }
  | { type: "STOCK_ALERT";        to: string; customerName: string; productName: string; price: number }
  | { type: "QA_QUESTION";        to: string; vendorName: string; productName: string; question: string }
  | { type: "QA_ANSWER";          to: string; customerName: string; productName: string; question: string; answer: string }
  | { type: "WEEKLY_DIGEST";      to: string; customerName: string; topProducts: any[]; newProducts: any[] }
  | { type: "PAYMENT_CONFIRMED";  to: string; customerName: string; orderId: string; amount: number; transactionId: string }
  | { type: "REFUND_PROCESSED";   to: string; customerName: string; orderId: string; amount: number; currency: string; refundId: string }
  | { type: "VERIFY_EMAIL";       to: string; name: string; verifyUrl: string }
  | { type: "RESET_PASSWORD";     to: string; resetToken: string };