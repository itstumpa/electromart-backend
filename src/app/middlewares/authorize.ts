import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import ApiError from "../../utils/apiErrors";

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }
    console.log("===== AUTH DEBUG =====");
console.log("req.user:", req.user);
console.log("role:", (req.user as any)?.role);
console.log("type:", typeof (req.user as any)?.role);
console.log("======================");

    // ─────────────────────────────
    // Normalize user role safely
    // ─────────────────────────────
    const userRole = String((req.user as any).role)
      .toUpperCase()
      .trim();

    const allowedRoles = roles.map((r) =>
      String(r).toUpperCase().trim()
    );

    // ─────────────────────────────
    // Super admin bypass (safe check)
    // ─────────────────────────────
    if (userRole === "SUPER_ADMIN") {
      return next();
    }

    // ─────────────────────────────
    // Role check
    // ─────────────────────────────
    if (!allowedRoles.includes(userRole)) {
      return next(
        new ApiError(
          403,
          "Forbidden: you don't have access to this resource"
        )
      );
    }

    next();
  };