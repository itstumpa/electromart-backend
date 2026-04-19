// src/app/modules/address/address.validation.ts
import { z } from "zod";

export const createAddressSchema = z.object({
  body: z.object({
    label:      z.string().min(1, "Label is required"),
    fullName:   z.string().min(2),
    phone:      z.string().min(6),
    street:     z.string().min(3),
    city:       z.string().min(2),
    state:      z.string().min(2),
    country:    z.string().default("Bangladesh"),
    postalCode: z.string().min(3),
    isDefault:  z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label:      z.string().min(1).optional(),
    fullName:   z.string().min(2).optional(),
    phone:      z.string().min(6).optional(),
    street:     z.string().min(3).optional(),
    city:       z.string().min(2).optional(),
    state:      z.string().min(2).optional(),
    country:    z.string().optional(),
    postalCode: z.string().min(3).optional(),
    isDefault:  z.boolean().optional(),
  }),
});