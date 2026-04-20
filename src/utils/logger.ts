// src/utils/logger.ts
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // console — always
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    }),
  ],
});

// file transports — only in production
if (process.env.NODE_ENV === "production") {
  logger.add(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
    })
  );
  logger.add(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
    })
  );
}

export default logger;