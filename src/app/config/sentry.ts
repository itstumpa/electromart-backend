// src/config/sentry.ts
import * as Sentry from "@sentry/node";

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // 10% of transactions
  });

  console.log("✅ Sentry initialized");
};

export { Sentry };