// src/jobs/workers/index.ts
import { startEmailWorker }        from "./email.worker";
import { startUploadWorker }       from "./upload.worker";
import { startNotificationWorker } from "./notification.worker";
import { startPaymentWorker }      from "./payment.worker";

export const startAllWorkers = () => {
  startEmailWorker();
  startUploadWorker();
  startNotificationWorker();
  startPaymentWorker();
};