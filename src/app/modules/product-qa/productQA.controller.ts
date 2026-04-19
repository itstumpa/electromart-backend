import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as QAService from "./productQA.service";

export const askQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.askQuestion(req.user!.id, req.params.productId, req.body.question);
  sendResponse(res, { statusCode: 201, success: true, message: "Question submitted", data });
});

export const getProductQA = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.getProductQA(req.params.productId);
  sendResponse(res, { statusCode: 200, success: true, message: "Q&A fetched", data });
});

export const answerQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.answerQuestion(req.params.questionId, req.user!.id, req.body.answer);
  sendResponse(res, { statusCode: 200, success: true, message: "Question answered", data });
});

export const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await QAService.deleteQuestion(req.params.questionId, req.user!.id, req.user!.role === "ADMIN");
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});