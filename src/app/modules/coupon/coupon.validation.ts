// src/app/modules/coupon/coupon.validation.ts
import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
    discountValue: z.number().min(0, "Discount value is required"),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    startDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).nullable().optional(),
    maxDiscount: z.number().min(0).nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    expiryDate: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
  }),
});