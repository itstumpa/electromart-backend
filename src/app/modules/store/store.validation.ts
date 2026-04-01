// src/app/modules/store/store.validation.ts
import { z } from "zod";

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Store name must be at least 2 characters"),
    description: z.string().optional(),
    logo: z.string().url().optional(),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    logo: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});