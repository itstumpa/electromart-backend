// src/middlewares/authenticate.ts

import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '../../lib/prisma';
import ApiError from '../../utils/apiErrors';
import { setAuthCookies } from '../../utils/cookieHelpers';
import config from '../config';
import { generateAccessToken, generateRefreshToken } from '../modules/auth/auth.utils';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, async (err: unknown, user: Express.User | false) => {
    if (err) return next(err);

    // CASE 1: Access token valid
    if (user) {
      req.user = normalizeUser(user);
      (req as any).isSuperAdmin = user.role === 'ADMIN';
      return next();
    }
    // ─────────────────────────────
    // CASE 2: Try refresh token
    // ─────────────────────────────
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    try {
      const payload = jwt.verify(refreshToken, config.refreshSecret as string) as { sub: string; jti?: string };

      // ── C-4: Refresh token replay protection ──
      if (payload.jti) {
        try {
          const { getRedis } = await import('../../app/config/redis');
          const redis = getRedis();
          const blacklisted = await redis.get(`bl_rt:${payload.jti}`);
          if (blacklisted) {
            return next(new ApiError(401, 'Session expired. Please sign in again.'));
          }
          // Blacklist this token — it's being rotated
          await redis.set(`bl_rt:${payload.jti}`, '1', 'EX', 7 * 24 * 60 * 60);
        } catch {
          // Redis unavailable — skip (graceful degradation)
        }
      }
      // ────────────────────────────────────────────

      const foundUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEmailVerified: true,
          isBanned: true,
        },
      });

      if (!foundUser) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      if (foundUser.isBanned) {
        return next(new ApiError(403, 'Your account has been suspended. Please contact support for assistance.'));
      }

      // rotate tokens
      const newAccessToken = generateAccessToken(foundUser.id, foundUser.role);
      const newRefreshToken = generateRefreshToken(foundUser.id);

      setAuthCookies(res, newAccessToken, newRefreshToken);

      // After refresh token rotation
      req.user = normalizeUser(foundUser);
      (req as any).isSuperAdmin = foundUser.role === 'ADMIN';
      return next();
    } catch {
      return next(new ApiError(401, 'Session expired. Please sign in again.'));
    }
  })(req, res, next);
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
