// src/app/modules/return/return.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as ReturnService from "./return.service";

export const createReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const data = await ReturnService.createReturnRequest(
    req.user!.id,
    req.params.orderItemId as string,
    req.body.reason
  );
  sendResponse(res, { statusCode: 201, success: true, message: "Return request submitted", data });
});

export const getVendorReturnRequests = catchAsync(async (req: Request, res: Response) => {
  const data = await ReturnService.getVendorReturnRequests(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Return requests fetched", data });
});

export const resolveReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const data = await ReturnService.resolveReturnRequest(
    req.params.returnId as string,
    req.user!.id,
    req.body.status,
    req.body.vendorNote
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Return request resolved", data });
});

export const getMyReturnRequests = catchAsync(async (req: Request, res: Response) => {
  const data = await ReturnService.getMyReturnRequests(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your return requests", data });
});