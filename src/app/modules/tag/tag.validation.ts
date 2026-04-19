import { z } from "zod";

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30),
  }),
});

export const addTagsToProductSchema = z.object({
  body: z.object({
    tagIds: z.array(z.string()).min(1),
  }),
});