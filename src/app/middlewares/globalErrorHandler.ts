// src/middlewares/globalErrorHandler.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import ApiError from "../../utils/apiErrors";

const isDev = process.env.NODE_ENV === "development";

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: object;
  stack?: string;
}

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: object | undefined;

  // ── 1. Our own ApiError ───────────────────────────────────────────────────
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = isDev ? err.message : "Something went wrong";
  }

  // ── 2. Zod validation error ───────────────────────────────────────────────
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // ── 3. Prisma known errors ────────────────────────────────────────────────
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // unique constraint failed
        const field = (err.meta?.target as string[])?.join(", ") || "field";
        statusCode = 409;
        message = `A record with this ${field} already exists`;
        break;
      }
      case "P2025":
        // record not found
        statusCode = 404;
        message = "Record not found";
        break;
      case "P2003":
        // foreign key constraint
        statusCode = 400;
        message = "Related record not found";
        break;
      case "P2014":
        statusCode = 400;
        message = "Invalid relation data provided";
        break;
      default:
        statusCode = 400;
        message = "Database operation failed";
    }
  }

  // ── 4. Prisma validation error ────────────────────────────────────────────
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided to database";
  }

  // ── 5. JWT errors ─────────────────────────────────────────────────────────
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Your session has expired, please log in again";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token, please log in again";
  }

  // ── 6. Multer errors ──────────────────────────────────────────────────────
  else if (err instanceof Error && err.name === "MulterError") {
    statusCode = 400;
    message =
      ((err as Error & { code?: string }).code === "LIMIT_FILE_SIZE")
        ? "File too large — maximum size is 5MB"
        : (err as Error & { code?: string }).code === "LIMIT_FILE_COUNT"
        ? "Too many files — maximum is 5 images"
        : "File upload error";
  }

  // ── 7. Generic JS error ───────────────────────────────────────────────────
  else if (err instanceof Error) {
    message = err.message || "Something went wrong";
  }

  // ── Build response ────────────────────────────────────────────────────────
  const response: ErrorResponse = {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
    ...(isDev && err instanceof Error && { stack: err.stack }),
  };

  // log in dev
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;