import { z } from "zod";

export const askQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(5, "Question too short"),
  }),
});

export const answerQuestionSchema = z.object({
  body: z.object({
    answer: z.string().min(3, "Answer too short"),
  }),
});