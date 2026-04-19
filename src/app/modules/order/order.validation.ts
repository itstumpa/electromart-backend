// src/app/modules/order/order.validation.ts
import { z } from "zod";

export const placeOrderSchema = z.object({
  body: z.object({
    // cart is already in session, no body needed
    couponCode: z.string().optional(),
    shippingAddress: z.string().min(5, "Shipping address is required"),
  }),
});

export const updateOrderItemStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  }),
});