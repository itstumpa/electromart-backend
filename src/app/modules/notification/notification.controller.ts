// src/app/modules/notification/notification.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as NotificationService from "./notification.service";
import ApiError from "../../../utils/apiErrors";

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

export const sendNotification = catchAsync(async (req: Request, res: Response) => {
  const data = await NotificationService.sendManualNotification(req.body);
  if (!req.body.targetType) {
  throw new ApiError(400, "targetType is required");
}

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Notification sent successfully",
    data,
  });
});

export const testNotification = catchAsync(async (req: Request, res: Response) => {
  const data = await NotificationService.testNotification(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Test notification sent",
    data,
  });
});

export const toggleEmailNotification = catchAsync(async (req: Request, res: Response) => {
  const data = await NotificationService.toggleEmailNotification(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Email notification preference updated",
    data,
  });
});