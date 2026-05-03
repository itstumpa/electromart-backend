// src/app/modules/admin/admin.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import { IOptions } from '../../../utils/paginationHelper';
import sendResponse from '../../../utils/sendResponse';
import * as AdminService from './admin.service';

export const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await AdminService.getDashboardOverview();
  sendResponse(res, { statusCode: 200, success: true, message: 'Dashboard overview', data });
});

export const getRevenueByStore = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const result = await AdminService.getRevenueByStore({ page, limit, sortBy, sortOrder } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'Revenue by store', meta: result.meta, data: result.data });
});

export const getRecentPayments = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const result = await AdminService.getRecentPayments({ page, limit, sortBy, sortOrder } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'Recent payments', meta: result.meta, data: result.data });
});

export const getVendors = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, search, isActive } = req.query;
  const result = await AdminService.getVendors({ search: search as string, isActive: isActive as string }, {
    page,
    limit,
    sortBy,
    sortOrder,
  } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'Vendors fetched', meta: result.meta, data: result.data });
});

export const getTopSellingProducts = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await AdminService.getTopSellingProducts({ page, limit } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'Top selling products', meta: result.meta, data: result.data });
});
