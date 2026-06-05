import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    logo: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    logo: z.string().optional(),
    description: z.string().optional(),
  }),
});
