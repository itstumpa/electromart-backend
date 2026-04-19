// src/app/modules/review/review.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import * as ReviewService from "./review.service";

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await ReviewService.createReview(
    req.user!.id,
    req.params.productId as string,
    req.body
  );
  sendResponse(res, { statusCode: 201, success: true, message: "Review submitted", data: review });
});

export const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getProductReviews(req.params.productId as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Reviews fetched", data: result });
});

export const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await ReviewService.getMyReviews(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your reviews fetched", data: reviews });
});

export const updateReview = catchAsync(async (req: Request, res: Response) => {
  const review = await ReviewService.updateReview(
    req.params.reviewId  as string,
    req.user!.id,
    req.body
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Review updated", data: review });
});

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === "ADMIN";
  const result = await ReviewService.deleteReview(
    req.params.reviewId  as string,
    req.user!.id,
    isAdmin
  );
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});