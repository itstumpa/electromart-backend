// src/app/modules/return/return.validation.ts
import { z } from "zod";

export const createReturnSchema = z.object({
  body: z.object({
    reason: z.string().min(10, "Please provide a detailed reason"),
  }),
});

export const resolveReturnSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    vendorNote: z.string().optional(),
  }),
});