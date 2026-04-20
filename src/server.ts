import "./app/config/env";
import http from "http";
import { Server } from "http";

import app from "./app";
import config from "./app/config";
import { bootstrapApp } from "./app/bootstrap";
import { prisma } from "./lib/prisma";
import { validateEnv } from "./utils/envValidator";
import { initSentry } from "./app/config/sentry";
import { initSocket } from "./socket/socket";
import { startLeaderboardJob } from "./jobs/leaderboard.job";
import { startWeeklyDigestJob } from "./jobs/weeklyDigest.job";
import { startAllWorkers } from "./jobs/workers";
import { getRedis } from "./app/config/redis";
import logger from "./utils/logger";

const redis = getRedis();

// validate env before anything
// validateEnv();
initSentry();

async function startServer() {
  const port = config.port || 3000;

  try {
    await bootstrapApp();

    // Create only one HTTP server
    const httpServer: Server = http.createServer(app);

    // Initialize socket with same server
    initSocket(httpServer);

    httpServer.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📖 Swagger → http://localhost:${port}/api-docs`);
      logger.info(`🏥 Health → http://localhost:${port}/health`);

      // background jobs
      startLeaderboardJob();
      startWeeklyDigestJob();
      // startAllWorkers();
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`⚠️ ${signal} received — shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info("✅ HTTP server closed");

        await prisma.$disconnect();
        logger.info("✅ Database disconnected");

        await redis.quit();
        logger.info("✅ Redis disconnected");

        logger.info("👋 Goodbye!");
        process.exit(0);
      });

      // force shutdown after 10s
      setTimeout(() => {
        logger.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();