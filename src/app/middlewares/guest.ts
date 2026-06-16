import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import passport from "passport";
import config from "../config";

const isProduction = config.node_env === "production";
const isCrossOrigin = isProduction ||
  config.frontend_url.startsWith("https://") ||
  config.backend_url.startsWith("https://");

const GUEST_COOKIE_NAME = "guestId";
const GUEST_MAX_AGE = 48 * 60 * 60 * 1000; // 48 hours

const guestCookieOptions = {
  httpOnly: true,
  secure: isCrossOrigin,
  sameSite: (isCrossOrigin ? "none" : "lax") as "none" | "lax" | "strict",
  path: "/",
  maxAge: GUEST_MAX_AGE,
};

/**
 * Sets up guest session (generates guestId cookie if needed).
 * Does NOT set req.user - just ensures guestId cookie exists.
 */
export const ensureGuestSession = (req: Request, res: Response, next: NextFunction) => {
  let guestId = req.cookies?.[GUEST_COOKIE_NAME];

  if (!guestId || typeof guestId !== "string" || guestId.length < 10) {
    guestId = uuidv4();
    res.cookie(GUEST_COOKIE_NAME, guestId, guestCookieOptions);
  }

  // Store guestId on req for later use
  (req as any).guestId = guestId;
  next();
};

/**
 * Combined middleware: tries to authenticate user first, then falls back to guest.
 * Sets req.user with either authenticated user or guest info.
 * Use this on routes that need to support both authenticated and guest users.
 */
export const authenticateOrGuest = (req: Request, res: Response, next: NextFunction) => {
  // First try passport JWT authentication
  passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) return next(err);

    if (user) {
      // Authenticated user - normalize and attach
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      };
      return next();
    }

    // No authenticated user - fall back to guest
    let guestId = req.cookies?.[GUEST_COOKIE_NAME];

    if (!guestId || typeof guestId !== "string" || guestId.length < 10) {
      guestId = uuidv4();
      res.cookie(GUEST_COOKIE_NAME, guestId, guestCookieOptions);
    }

    req.user = {
      id: "",
      name: "Guest",
      email: "",
      role: "CUSTOMER" as any,
      isEmailVerified: false,
      guestId,
    };

    next();
  })(req, res, next);
};

/**
 * Extracts `guestId` from the HTTP‑only cookie.
 * If missing, generates a new UUID and sets the cookie.
 * Always sets `req.user.guestId`.
 * @deprecated Use authenticateOrGuest instead for routes supporting both auth and guest
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  // If a real user is already authenticated (by passport JWT), skip guest logic
  if (req.user?.id) {
    return next();
  }

  let guestId = req.cookies?.[GUEST_COOKIE_NAME];

  if (!guestId || typeof guestId !== "string" || guestId.length < 10) {
    guestId = uuidv4();
    _res.cookie(GUEST_COOKIE_NAME, guestId, guestCookieOptions);
  }

  // Set guest info on req.user so controllers can use req.user!.guestId
  req.user = {
    id: "",        // not a real user
    name: "Guest",
    email: "",
    role: "CUSTOMER" as any,
    isEmailVerified: false,
    guestId,
  };

  next();
};

/**
 * Ensures a guest session exists (optional + generates cookie).
 * Use this on routes that NEED a guest context but don't require auth.
 */
export const guestOnly = (req: Request, res: Response, next: NextFunction) => {
  // If authenticated user, skip guest requirement
  if (req.user?.id) {
    return next();
  }

  let guestId = req.cookies?.[GUEST_COOKIE_NAME];

  if (!guestId || typeof guestId !== "string" || guestId.length < 10) {
    guestId = uuidv4();
    res.cookie(GUEST_COOKIE_NAME, guestId, guestCookieOptions);
  }

  if (!req.user) {
    req.user = {
      id: "",
      name: "Guest",
      email: "",
      role: "CUSTOMER" as any,
      isEmailVerified: false,
      guestId,
    };
  } else {
    req.user.guestId = guestId;
  }

  next();
};
