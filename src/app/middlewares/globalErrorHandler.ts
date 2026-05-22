// src/middlewares/globalErrorHandler.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import ApiError from "../../utils/apiErrors";

const isDev = process.env.NODE_ENV === "development";

interface ErrorSource {
  path?: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  errorSources?: ErrorSource[];
  stack?: string;
}

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: Array<{ field: string; message: string }> | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message =
      isDev || statusCode < 500 ? err.message : "Something went wrong";
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const field = (err.meta?.target as string[])?.join(", ") || "field";
        statusCode = 409;
        message = `A record with this ${field} already exists`;
        break;
      }
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;
      case "P2003":
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
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided to database";
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Your session has expired, please log in again";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token, please log in again";
  } else if (err instanceof Error && err.name === "MulterError") {
    statusCode = 400;
    message =
      (err as Error & { code?: string }).code === "LIMIT_FILE_SIZE"
        ? "File too large — maximum size is 5MB"
        : (err as Error & { code?: string }).code === "LIMIT_FILE_COUNT"
          ? "Too many files — maximum is 5 images"
          : "File upload error";
  } else if (err instanceof Error) {
    message = err.message || "Something went wrong";
  }

  const errorSources: ErrorSource[] | undefined = errors?.map((e) => ({
    path: e.field,
    message: e.message,
  }));

  const response: ErrorResponse = {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
    ...(errorSources && errorSources.length > 0 && { errorSources }),
    ...(isDev && err instanceof Error && { stack: err.stack }),
  };

  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;
