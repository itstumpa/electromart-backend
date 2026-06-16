// src/app/modules/auth/auth.validation.ts
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: passwordSchema,
    role: z.enum(["CUSTOMER", "VENDOR"]).optional(),
    storeName: z.string().min(2, "Store name must be at least 2 characters").optional(),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),
});