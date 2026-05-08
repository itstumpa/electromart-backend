// src/middlewares/authenticate.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiErrors";
import { setAuthCookies } from "../../utils/cookieHelpers";
import config from "../config";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../modules/auth/auth.utils";
import { Role } from "@prisma/client";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    async (err: unknown, user: Express.User | false) => {
      if (err) return next(err);

      // ─────────────────────────────
      // CASE 1: Access token valid
      // ─────────────────────────────
      if (user) {
        req.user = normalizeUser(user);
        return next();
      }
// Add to authenticate.ts (temporarily)
console.log('Access token cookie:', req.cookies?.accessToken);

// Decode without verifying (see payload structure)
if (req.cookies?.accessToken) {
  const decoded = jwt.decode(req.cookies.accessToken);
  console.log('Decoded payload:', decoded);
}
      // ─────────────────────────────
      // CASE 2: Try refresh token
      // ─────────────────────────────
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return next(new ApiError(401, "Unauthorized"));
      }

      try {
        const payload = jwt.verify(
          refreshToken,
          config.refreshSecret as string,
        ) as { sub: string };

        const foundUser = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // ✅ IMPORTANT FIX
            isEmailVerified: true,
          },
        });

        if (!foundUser) {
          return next(new ApiError(401, "Unauthorized"));
        }

        // rotate tokens
        const newAccessToken = generateAccessToken(
          foundUser.id,
          foundUser.role,
        );
console.log('All cookies:', req.cookies);
console.log('Headers:', req.headers);
        const newRefreshToken = generateRefreshToken(foundUser.id);

        setAuthCookies(res, newAccessToken, newRefreshToken);

        // 🔥 CRITICAL FIX: normalize user shape
        req.user = normalizeUser(foundUser);

        return next();
      } catch {
        return next(
          new ApiError(401, "Session expired. Please sign in again."),
        );
      }
    },
  )(req, res, next);
};

// ─────────────────────────────────────────────
// Normalize user shape (VERY IMPORTANT)
// ─────────────────────────────────────────────
const normalizeUser = (user: AuthUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});