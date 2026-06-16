import rateLimit from "express-rate-limit";

const WHITELISTED_IPS = (process.env.RATE_LIMIT_WHITELIST_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

const isWhitelistedIP = (req: any): boolean => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return WHITELISTED_IPS.includes(ip);
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
    if (isWhitelistedIP(req)) return true;
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
  skip: (req) => isWhitelistedIP(req),
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
  skip: (req) => isWhitelistedIP(req),
});

/** Rate limiter for guest order tracking — 5 requests per 15 min per IP */
export const guestOrderTrackerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many tracking requests, please try again after 15 minutes",
  },
  skip: (req) => isWhitelistedIP(req),
});

/** Admin-specific limiter — higher limit than auth but still finite */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests, please slow down",
  },
  skip: (req) => isWhitelistedIP(req),
});