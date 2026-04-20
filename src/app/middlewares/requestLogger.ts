// src/middlewares/requestLogger.ts
import morgan from "morgan";
import logger from "../../utils/logger";

// stream morgan into winston
const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => process.env.NODE_ENV === "test";

export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);