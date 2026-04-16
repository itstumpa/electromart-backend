// src/app/modules/notification/notification.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as NotificationService from "./notification.service";

export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const data = await NotificationService.getUserNotifications(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Notifications fetched", data });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.markAsRead(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Marked as read", data: null });
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await NotificationService.markAllAsRead(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "All marked as read", data: null });
});

export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const data = await NotificationService.getUnreadCount(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Unread count", data });
});