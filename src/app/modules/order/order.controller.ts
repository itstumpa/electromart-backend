// src/app/modules/order/order.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as OrderService from "./order.service";
import { OrderStatus } from "@prisma/client";

export const placeOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await OrderService.placeOrder(req.user!.id);
  sendResponse(res, { statusCode: 201, success: true, message: "Order placed successfully", data: order });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await OrderService.getMyOrders(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Orders fetched", data: orders });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === "ADMIN";
  const order = await OrderService.getOrderById(req.params.id as string, req.user!.id, isAdmin);
  sendResponse(res, { statusCode: 200, success: true, message: "Order fetched", data: order });
});

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.cancelOrder(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getVendorOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await OrderService.getVendorOrders(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Vendor orders fetched", data: orders });
});

export const updateOrderItemStatus = catchAsync(async (req: Request, res: Response) => {
  const item = await OrderService.updateOrderItemStatus(
    req.params.itemId as string,
    req.user!.id,
    req.body.status as OrderStatus
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Order item status updated", data: item });
});

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await OrderService.getAllOrders();
  sendResponse(res, { statusCode: 200, success: true, message: "All orders fetched", data: orders });
});