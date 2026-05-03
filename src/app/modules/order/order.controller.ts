// src/app/modules/order/order.controller.ts
import { OrderStatus } from '@prisma/client';
import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import { IOptions } from '../../../utils/paginationHelper';
import sendResponse from '../../../utils/sendResponse';
import * as OrderService from './order.service';

export const placeOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await OrderService.placeOrder(req.user!.id, req.body.couponCode);
  sendResponse(res, { statusCode: 201, success: true, message: 'Order placed successfully', data: order });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const result = await OrderService.getMyOrders(req.user!.id, { page, limit, sortBy, sortOrder } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'Orders fetched', meta: result.meta, data: result.data });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const order = await OrderService.getOrderById(req.params.id as string, req.user!.id, isAdmin);
  sendResponse(res, { statusCode: 200, success: true, message: 'Order fetched', data: order });
});

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.cancelOrder(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getVendorOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await OrderService.getVendorOrders(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Vendor orders fetched', data: orders });
});

export const updateOrderItemStatus = catchAsync(async (req: Request, res: Response) => {
  const item = await OrderService.updateOrderItemStatus(
    req.params.itemId as string,
    req.user!.id,
    req.body.status as OrderStatus
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Order item status updated', data: item });
});

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, status, search } = req.query;
  const result = await OrderService.getAllOrders({ status: status as string, search: search as string }, {
    page,
    limit,
    sortBy,
    sortOrder,
  } as IOptions);
  sendResponse(res, { statusCode: 200, success: true, message: 'All orders fetched', meta: result.meta, data: result.data });
});
