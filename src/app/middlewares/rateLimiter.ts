// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";

// ── Global limiter — all routes ───────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests, please try again after 15 minutes",
  },
  skip: (req) => {
    // skip rate limit for webhooks — they must always go through
    return (
      req.path.includes("/sslcommerz/ipn") ||
      req.path.includes("/stripe/webhook")
    );
  },
});

// ── Auth limiter — stricter for login/signup ──────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // only 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many auth attempts, please try again after 15 minutes",
  },
});

// ── Search limiter — prevent scraping ────────────────────────────────────────
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,                  // 30 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many search requests, slow down",
  },
});