import { Request, Response } from 'express';
import * as PayoutService from './payout.service';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';

export const getMyPayouts = catchAsync(async (req: Request, res: Response) => {
  const data = await PayoutService.getMyPayouts(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Payouts fetched', data });
});

export const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const data = await PayoutService.getMyTransactions(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Transactions fetched', data });
});

export const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const data = await PayoutService.requestPayout(req.user!.id, req.body.amount);
  sendResponse(res, { statusCode: 201, success: true, message: 'Payout requested', data });
});