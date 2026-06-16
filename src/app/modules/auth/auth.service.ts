// src/app/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { emailQueue } from '../../../jobs/queues/email.queue';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { setAuthCookies } from '../../../utils/cookieHelpers';
import { sendEmail } from '../../../utils/sendEmail';
import config from '../../config/index';

// ── Token helpers ─────────────────────────────────────────────────────────────

const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES || '7d') as SignOptions['expiresIn'];

const generateAccessToken = (userId: string, role: string) =>
  jwt.sign({ sub: userId, role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: ACCESS_EXPIRES,
  });

const generateRefreshToken = (userId: string) =>
  jwt.sign({ sub: userId, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_EXPIRES,
  });

// ── Signup ────────────────────────────────────────────────────────────────────

const generateStoreSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ── Merge guest data into user account ──────────────────────────────────────
const mergeGuestData = async (guestId: string, userId: string) => {
  // Merge cart: move guest cart items to user cart
  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  if (guestCart && guestCart.items.length > 0) {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (userCart) {
      // Merge items into existing user cart (skip duplicates)
      for (const item of guestCart.items) {
        const existing = userCart.items.find((i) => i.productId === item.productId && i.variantId === item.variantId);
        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            },
          });
        }
      }
    } else {
      // Reassign guest cart to user
      await prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, guestId: null },
      });
    }
  } else if (guestCart) {
    // Empty guest cart — just delete it
    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  // Merge wishlist: move guest wishlist items to user wishlist
  const guestWishlist = await prisma.wishlist.findUnique({
    where: { guestId },
    include: { items: true },
  });

  if (guestWishlist && guestWishlist.items.length > 0) {
    const userWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (userWishlist) {
      // Add items not already in user wishlist
      for (const item of guestWishlist.items) {
        const exists = userWishlist.items.some((i) => i.productId === item.productId);
        if (!exists) {
          await prisma.wishlistItem.create({
            data: {
              wishlistId: userWishlist.id,
              productId: item.productId,
            },
          });
        }
      }
    } else {
      // Reassign guest wishlist to user
      await prisma.wishlist.update({
        where: { id: guestWishlist.id },
        data: { userId, guestId: null },
      });
    }
  } else if (guestWishlist) {
    await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
  }
};

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  storeName?: string;
  guestId?: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const role = data.role ?? 'CUSTOMER';

  const user =
    role === 'VENDOR' && data.storeName
      ? await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              name: data.name,
              email: data.email,
              password: hashedPassword,
              role,
              emailVerifyToken,
              emailVerifyExpiry,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          });

          let slug = generateStoreSlug(data.storeName!);
          const slugTaken = await tx.store.findUnique({ where: { slug } });
          if (slugTaken) {
            slug = `${slug}-${created.id.slice(0, 8)}`;
          }

          await tx.store.create({
            data: {
              name: data.storeName!.trim(),
              slug,
              ownerId: created.id,
            },
          });

          return created;
        })
      : await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role,
            emailVerifyToken,
            emailVerifyExpiry,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

  // Merge guest cart/wishlist if guestId provided
  if (data.guestId) {
    await mergeGuestData(data.guestId, user.id);
  }

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;

  if (process.env.REDIS_URL) {
    await emailQueue.add('verify-email', {
      type: 'VERIFY_EMAIL',
      to: user.email,
      name: user.name,
      verifyUrl,
    });
  } else {
    console.warn('⚠️ Redis not configured, skipping email queue');
  }

  return user;
};

// ── Verify Email ──────────────────────────────────────────────────────────────

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });

  return { message: 'Email verified successfully' };
};

// ── Resend Verification ───────────────────────────────────────────────────────

export const resendEmailVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isEmailVerified) throw new ApiError(400, 'Email already verified');

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken, emailVerifyExpiry },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your Electromart account',
    html: `<p>New verification link: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return { message: 'Verification email resent' };
};

// ── Account lockout helpers ────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const getLockoutKey = (email: string) => `lockout:${email.toLowerCase()}`;
const getAttemptsKey = (email: string) => `failed_login:${email.toLowerCase()}`;

const checkAccountLockout = async (email: string): Promise<void> => {
  try {
    const { getRedis } = await import('../../config/redis');
    const redis = getRedis();
    const locked = await redis.get(getLockoutKey(email));
    if (locked) {
      const ttl = await redis.ttl(getLockoutKey(email));
      throw new ApiError(429, `Too many failed login attempts. Please try again in ${Math.ceil(ttl / 60)} minutes.`);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Redis unavailable — allow login (graceful degradation)
  }
};

const recordFailedAttempt = async (email: string): Promise<void> => {
  try {
    const { getRedis } = await import('../../config/redis');
    const redis = getRedis();
    const key = getAttemptsKey(email);
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      // Set expiry so counter resets after a window
      await redis.expire(key, LOCKOUT_MINUTES * 60);
    }
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await redis.set(getLockoutKey(email), '1', 'EX', LOCKOUT_MINUTES * 60);
      await redis.del(key);
    }
  } catch {
    // Redis unavailable — skip tracking (graceful degradation)
  }
};

const clearFailedAttempts = async (email: string): Promise<void> => {
  try {
    const { getRedis } = await import('../../config/redis');
    const redis = getRedis();
    await redis.del(getAttemptsKey(email));
    await redis.del(getLockoutKey(email));
  } catch {
    // Redis unavailable — skip cleanup (graceful degradation)
  }
};

// ── Signin ────────────────────────────────────────────────────────────────────

export const signin = async (email: string, password: string, res: Response, guestId?: string) => {
  // Check lockout before processing credentials
  await checkAccountLockout(email);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordFailedAttempt(email);
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await recordFailedAttempt(email);
    throw new ApiError(401, 'Invalid email or password');
  }

  // Successful login — clear failed attempt counters
  await clearFailedAttempts(email);

  if (!user.isEmailVerified) throw new ApiError(403, 'Please verify your email before signing in');

  if (user.isBanned) throw new ApiError(403, 'Your account has been suspended. Please contact support for assistance.');

  // Merge guest cart/wishlist before signing in
  if (guestId) {
    await mergeGuestData(guestId, user.id);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  setAuthCookies(res, accessToken, refreshToken); // ✅ both in cookies

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

// ── Refresh Token ─────────────────────────────────────────────────────────────

export const refreshToken = async (token: string, res: Response) => {
  try {
    const payload = jwt.verify(token, config.refreshSecret as string) as {
      sub: string;
      jti?: string;
    };

    // ── C-4: Refresh token replay protection ──
    if (payload.jti) {
      try {
        const { getRedis } = await import('../../config/redis');
        const redis = getRedis();
        const blacklisted = await redis.get(`bl_rt:${payload.jti}`);
        if (blacklisted) {
          // Token reuse detected — likely a stolen token replay
          throw new ApiError(401, 'Invalid or expired refresh token');
        }
        // Blacklist this token — it's being rotated
        await redis.set(`bl_rt:${payload.jti}`, '1', 'EX', 7 * 24 * 60 * 60);
      } catch {
        // Redis unavailable — skip (graceful degradation)
      }
    }
    // ────────────────────────────────────────────

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, 'User not found');

    if (user.isBanned) throw new ApiError(403, 'Your account has been suspended. Please contact support for assistance.');

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    setAuthCookies(res, accessToken, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async () => {
  return { message: 'Logged out successfully' };
};

// ── Forgot Password ───────────────────────────────────────────────────────────

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // always return same message — don't reveal if email exists
  if (!user) return { message: 'If that email exists, a reset code was sent' };

  const resetToken = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12-char hex code (~2.8×10¹⁴ possibilities)
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    },
  });

  await emailQueue.add('reset-password', {
    type: 'RESET_PASSWORD',
    to: user.email,
    resetToken,
  });

  return { message: 'If that email exists, a reset code was sent' };
};

// ── Verify Reset Code ─────────────────────────────────────────────────────────

export const verifyResetCode = async (email: string, code: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      passwordResetToken: code,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired reset code');
  return { message: 'Code verified. You can now reset your password.' };
};

// ── Reset Password ────────────────────────────────────────────────────────────

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      passwordResetToken: code,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired reset code');

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return { message: 'Password reset successful' };
};

// ── Change Password ───────────────────────────────────────────────────────────

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Old password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { message: 'Password changed successfully' };
};

// ── Get Me ────────────────────────────────────────────────────────────────────

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      website: true,
      location: true,
      avatar: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};
