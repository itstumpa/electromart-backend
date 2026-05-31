import { z } from 'zod';

export const requestPayoutSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
  }),
});