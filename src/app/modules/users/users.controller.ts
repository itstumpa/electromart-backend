import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { invalidateCachePattern } from '../../../utils/cache';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { uploadToCloudinary } from '../../../utils/uploadToCloudinary';
import * as UserService from './users.service';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await UserService.getAllUsers();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users fetched successfully',
    data: users,
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User fetched successfully',
    data: user,
  });
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.updateUser(req.params.id as string, req.user!.id, req.user!.role, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw new ApiError(400, 'No image provided');

  const result = await uploadToCloudinary(file.buffer, 'Electromart/avatars');

  // Invalidate review caches for all products this user has reviewed
  const userReviews = await prisma.review.findMany({
    where: { customerId: req.user!.id },
    select: { productId: true },
    distinct: ['productId'],
  });
  await Promise.all(userReviews.map((r) => invalidateCachePattern(`reviews:product:${r.productId}:*`)));

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatar: result.secure_url },
    select: { id: true, name: true, email: true, avatar: true },
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Avatar uploaded successfully',
    data: user,
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(req.params.id as string, req.user!.role, req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

export const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.changeUserRole(req.params.id as string, req.body.role as Role);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User role updated',
    data: user,
  });
});

export const getNotificationPrefs = catchAsync(async (req: Request, res: Response) => {
  const prefs = await UserService.getNotificationPrefs(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification preferences fetched',
    data: prefs,
  });
});

export const updateNotificationPrefs = catchAsync(async (req: Request, res: Response) => {
  const prefs = await UserService.updateNotificationPrefs(req.user!.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification preferences updated',
    data: prefs,
  });
});

export const banUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.banUser(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: user.isBanned ? 'User banned' : 'User unbanned',
    data: user,
  });
});
