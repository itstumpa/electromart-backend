// src/app/modules/order/order.validation.ts
import { z } from "zod";

export const placeOrderSchema = z.object({
  body: z.object({
    couponCode: z.string().optional(),
    shippingAddress: z.object({
      fullName: z.string().min(1, "Full name is required"),
      phone: z.string().min(1, "Phone is required"),
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional().default(""),
      zipCode: z.string().optional().default(""),
      country: z.string().min(1, "Country is required"),
    }),
  }),
});

export const updateOrderItemStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  }),
});