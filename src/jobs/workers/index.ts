// src/jobs/workers/index.ts
import { startEmailWorker }        from "./email.worker";
import { startNotificationWorker } from "./notification.worker";
import { startPaymentWorker } from "./payment.worker";
import { startUploadWorker } from "./upload.worker";


export const startAllWorkers = () => {
  startEmailWorker();
  startUploadWorker();
  startNotificationWorker();
  startPaymentWorker();
};