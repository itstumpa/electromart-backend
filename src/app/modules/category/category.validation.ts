// src/app/modules/category/category.validation.ts
import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    image: z.string().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    image: z.string().optional(),
    isFeatured: z.boolean().optional(),
  }),
}); 