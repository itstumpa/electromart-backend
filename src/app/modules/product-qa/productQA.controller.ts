import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as QAService from "./productQA.service";

export const askQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.askQuestion(req.user!.id, req.params.productId as string, req.body.question);
  sendResponse(res, { statusCode: 201, success: true, message: "Question submitted", data });
});

export const getProductQA = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.getProductQA(req.params.productId  as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Q&A fetched", data });
});

export const answerQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.answerQuestion(req.params.questionId  as string, req.user!.id, req.body.answer);
  sendResponse(res, { statusCode: 200, success: true, message: "Question answered", data });
});

export const getVendorQuestions = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.getVendorQuestions(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Vendor questions fetched", data });
});

export const getAdminQuestions = catchAsync(async (req: Request, res: Response) => {
  const data = await QAService.getAdminQuestions();
  sendResponse(res, { statusCode: 200, success: true, message: "All questions fetched", data });
});

export const moderateQuestion = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === "ADMIN" || req.user!.role === "SUPER_ADMIN";
  const data = await QAService.moderateQuestion(req.params.questionId as string, req.user!.id, req.body.status, isAdmin);
  sendResponse(res, { statusCode: 200, success: true, message: `Question ${req.body.status.toLowerCase()}`, data });
});

export const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await QAService.deleteQuestion(req.params.questionId as string, req.user!.id, req.user!.role);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});