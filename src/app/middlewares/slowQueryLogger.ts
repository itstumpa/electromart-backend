// src/middlewares/slowQueryLogger.ts
import { Request, Response, NextFunction } from "express";
import logger from "../../utils/logger";

const SLOW_THRESHOLD_MS = 500;

export const slowQueryLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > SLOW_THRESHOLD_MS) {
      logger.warn(
        `🐢 SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`
      );
    }
  });

  next();
};