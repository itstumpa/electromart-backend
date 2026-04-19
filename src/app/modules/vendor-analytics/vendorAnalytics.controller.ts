// src/app/modules/vendor-analytics/vendorAnalytics.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { getVendorAnalytics } from "./vendorAnalytics.service";

export const getMyAnalytics = catchAsync(async (req: Request, res: Response) => {
  const data = await getVendorAnalytics(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Vendor analytics", data });
});