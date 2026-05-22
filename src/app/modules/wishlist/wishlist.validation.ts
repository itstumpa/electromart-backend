import { z } from "zod";

export const productIdParamSchema = z.object({
  params: z.object({
    productId: z.string().min(1, "Product id is required"),
  }),
});
