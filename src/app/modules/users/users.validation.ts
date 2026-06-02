import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN']).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.email('Invalid email').optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
  }),
});
