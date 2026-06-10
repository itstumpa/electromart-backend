// src/app/modules/order-tracking/orderTracking.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { getOrderTimeline } from "./orderTracking.service";

export const getTimeline = catchAsync(async (req: Request, res: Response) => {
  const data = await getOrderTimeline(req.params.orderId as string, req.user!.id, req.user!.role);
  sendResponse(res, { statusCode: 200, success: true, message: "Order timeline fetched", data });
});