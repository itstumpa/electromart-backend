// src/app/modules/coupon/coupon.validation.ts
import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountPercent: z.number().min(1).max(100),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
  }),
});