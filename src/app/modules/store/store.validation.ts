// src/app/modules/store/store.validation.ts
import { z } from "zod";

export const createStoreSchema = z.object({
  body: z.object({
    name:        z.string().min(2, 'Store name is required'),
    description: z.string().optional(),
    logo:        z.string().url().optional(),
    coverImage:  z.string().url().optional(),
    specialty:   z.string().optional(),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    name:        z.string().min(2).optional(),
    description: z.string().optional(),
    logo:        z.string().optional(),
    coverImage:  z.string().optional(),
    specialty:   z.string().optional(),
    badge:       z.string().optional(),
    offers:      z.string().optional(),
  }),
});

export const updateStorePoliciesSchema = z.object({
  body: z.object({
    returnPolicy:   z.string().min(1, 'Return policy is required'),
    shippingPolicy: z.string().min(1, 'Shipping policy is required'),
  }),
});

export const updateStoreSettingsSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    taxId: z.string().optional(),
    currency: z.string().optional(),
    payoutCycle: z.string().optional(),
    minPayout: z.string().optional(),
    autoAcceptOrders: z.boolean().optional(),
    autoUpdateStock: z.boolean().optional(),
    notifNewOrder: z.boolean().optional(),
    notifOrderCancelled: z.boolean().optional(),
    notifLowStock: z.boolean().optional(),
    notifNewReview: z.boolean().optional(),
    notifPayoutSent: z.boolean().optional(),
    notifReturnRequest: z.boolean().optional(),
    notifWeeklyReport: z.boolean().optional(),
    notifMarketingTips: z.boolean().optional(),
  }),
});