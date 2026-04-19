import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { getLeaderboard } from "./leaderboard.service";

export const getVendorLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const data = await getLeaderboard();
  sendResponse(res, { statusCode: 200, success: true, message: "Vendor leaderboard", data });
});