// src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import ApiError from "../../utils/apiErrors";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return next(new ApiError(401, "Unauthorized"));
      req.user = user; // TS will need this typed — see below
      next();
    }
  )(req, res, next);
};