import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as StockAlertService from "./stockAlert.service";

export const subscribe = catchAsync(async (req: Request, res: Response) => {
  const data = await StockAlertService.subscribeToStockAlert(req.user!.id, req.params.productId  as string);
  sendResponse(res, { statusCode: 201, success: true, message: "Subscribed to stock alert", data });
});

export const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await StockAlertService.unsubscribeFromStockAlert(req.user!.id, req.params.productId as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getMyAlerts = catchAsync(async (req: Request, res: Response) => {
  const data = await StockAlertService.getMyStockAlerts(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Stock alerts fetched", data });
});