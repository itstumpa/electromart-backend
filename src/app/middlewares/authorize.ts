import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import ApiError from "../../utils/apiErrors";

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }


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
  console.log('✅ SUPER_ADMIN bypass'); // add this
  return next();
}
console.log('❌ userRole:', userRole); // add this

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