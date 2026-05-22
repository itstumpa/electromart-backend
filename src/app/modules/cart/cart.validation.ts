// src/app/modules/cart/cart.validation.ts
import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
    variantId: z.string().optional(),
  }),
});

export const addToCartByProductIdSchema = z.object({
  params: z.object({
    productId: z.string().min(1, "Product ID is required"),
  }),
  body: z
    .object({
      quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").optional(),
      variantId: z.string().optional(),
    })
    .optional(),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
  }),
});

export const mergeCartSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    ).min(1, "No items to merge"),
  }),
});