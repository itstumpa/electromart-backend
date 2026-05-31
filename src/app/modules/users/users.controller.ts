import { Request, Response } from 'express';
import * as UserService from './users.service';
import sendResponse from '../../../utils/sendResponse';
import catchAsync from '../../../utils/catchAsync';
import { Role } from '@prisma/client';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
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