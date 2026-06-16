import { Response } from "express";
import config from "../app/config";

const isProduction = config.node_env === "production";
/**
 * Cross-origin check: if the backend or frontend URL uses HTTPS,
 * we must use SameSite=None + Secure for cross-site cookie delivery.
 * This is more reliable than relying on NODE_ENV alone, since the .env
 * file may set NODE_ENV=development even when deployed on Render (HTTPS).
 */
const isCrossOrigin = isProduction ||
  config.frontend_url.startsWith("https://") ||
  config.backend_url.startsWith("https://");

/**
 * Same-origin (Next.js rewrite): lax works.
 * Direct cross-origin API: use none + secure in production.
 */
const cookieOptions = {
  httpOnly: true,
  secure: isCrossOrigin,
  sameSite: (isCrossOrigin ? "none" : "lax") as "none" | "lax" | "strict",
  path: "/",
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  const clearOpts = {
    path: "/",
    sameSite: cookieOptions.sameSite,
    secure: isCrossOrigin,
  };
  res.clearCookie("accessToken", clearOpts);
  res.clearCookie("refreshToken", clearOpts);
}
