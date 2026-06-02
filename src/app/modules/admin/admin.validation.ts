import { z } from 'zod';

export const overviewValidation = z.object({});

export const revenueByStoreValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const recentPaymentsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const vendorsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const topSellingProductsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});