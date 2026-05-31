// src/app/modules/product/product.validation.ts
import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be positive"),
    originalPrice: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0).default(0),
    categoryId: z.string().min(1, "Category is required"),
    featured: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
    images: z.array(z.object({ url: z.string().url() })).optional(),
    variants: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          price: z.coerce.number().positive().optional(),
          stock: z.coerce.number().int().min(0).default(0),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0).optional(),
    categoryId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});