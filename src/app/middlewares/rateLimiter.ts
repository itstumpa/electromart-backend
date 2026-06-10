import rateLimit from "express-rate-limit";
import jwt from 'jsonwebtoken';

const WHITELISTED_IPS = (process.env.RATE_LIMIT_WHITELIST_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

const isPrivilegedRole = (req: any): boolean => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { role?: string };
    return decoded.role === 'SUPER_ADMIN';
  } catch {
    return false;
  }
};

const isWhitelisted = (req: any): boolean => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  if (WHITELISTED_IPS.includes(ip)) return true;
  if (isPrivilegedRole(req)) return true;
  return false;
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests, please try again after 15 minutes",
  },
  skip: (req) => {
    if (isWhitelisted(req)) return true;
    return (
      req.path.includes("/sslcommerz/ipn") ||
      req.path.includes("/stripe/webhook")
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many auth attempts, please try again after 15 minutes",
  },
  skip: (req) => isWhitelisted(req),
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many search requests, slow down",
  },
  skip: (req) => isWhitelisted(req),
});