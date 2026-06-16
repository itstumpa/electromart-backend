import { Response } from "express";
import config from "../app/config";

const isProduction = config.node_env === "production";

/**
 * Same-origin (Next.js rewrite): lax works.
 * Direct cross-origin API: use none + secure in production.
 */
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax" | "strict",
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
    secure: isProduction,
  };
  res.clearCookie("accessToken", clearOpts);
  res.clearCookie("refreshToken", clearOpts);
}
