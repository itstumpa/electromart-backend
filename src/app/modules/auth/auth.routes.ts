// src/app/modules/auth/auth.routes.ts
import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import * as authController from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  signinSchema,
  signupSchema,
} from "./auth.validation";
import { authLimiter } from "../../middlewares/rateLimiter";

const router = Router();

// ── Public ─────────────────────────────────────────────────────────────────
router.post("/signup", authLimiter,  validate(signupSchema), authController.signup);
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendEmailVerification);
router.post("/signin", authLimiter, validate(signinSchema), authController.signin);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password", authLimiter,
  validate(forgotPasswordSchema),
  authController.requestPasswordReset,
);
router.post("/verify-reset-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPasswordController);

// ── Protected ───────────────────────────────────────────────────────────────
router.use(authenticate);
router.get("/me", authController.getMe);
router.post("/logout", authController.logout);
router.post(
  "/change-password",
  validate(changePasswordSchema),
  authController.changePasswordController,
);

export const authRoute = router;
