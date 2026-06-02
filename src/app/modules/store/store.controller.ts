// src/app/modules/store/store.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as StoreService from "./store.service";

export const createStore = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.createStore(req.user!.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Store created successfully", data: store });
});

export const getAllStores = catchAsync(async (req: Request, res: Response) => {
  const stores = await StoreService.getAllStores();
  sendResponse(res, { statusCode: 200, success: true, message: "Stores fetched successfully", data: stores });
});

export const getStoreById = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.getStoreById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Store fetched successfully", data: store });
});

export const updateStore = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.updateStore(req.params.id as string, req.user!.id, req.body,  req.file, );
  console.log("USER:", req.user);
  sendResponse(res, { statusCode: 200, success: true, message: "Store updated successfully", data: store });
});

export const updateStorePolicies = catchAsync(async (req: Request, res: Response) => {
  const data = await StoreService.updateStorePolicies(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Policies updated', data });
});
 
export const pauseStore = catchAsync(async (req: Request, res: Response) => {
  const data = await StoreService.pauseStore(req.params.id as string, req.user!.id);
  const message = data.isActive ? 'Store resumed' : 'Store paused';
  sendResponse(res, { statusCode: 200, success: true, message, data });
});
 
export const deleteAllProducts = catchAsync(async (req: Request, res: Response) => {
  const data = await StoreService.deleteAllProducts(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: `${data.deleted} products deleted`, data });
});
 
export const closeStore = catchAsync(async (req: Request, res: Response) => {
  const data = await StoreService.closeStore(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Store closed', data });
});

export const deleteStore = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.deleteStore(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getMyStore = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.getMyStore(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your store fetched", data: store });
});

export const getTopVendors = catchAsync(async (req: Request, res: Response) => {
  const data = await StoreService.getTopVendors();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Top vendors fetched successfully',
    data,
  });
});

export const updateStoreSettings = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.updateStoreSettings(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Settings updated successfully",
    data: store,
  });
});

export const approveStore = catchAsync(async (req: Request, res: Response) => {
  const { isApproved } = req.body;
  const store = await StoreService.approveStore(req.params.id as string, Boolean(isApproved));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: isApproved ? 'Store approved' : 'Store approval revoked',
    data: store,
  });
});