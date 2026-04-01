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
  const store = await StoreService.updateStore(req.params.id as string, req.user!.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Store updated successfully", data: store });
});

export const deleteStore = catchAsync(async (req: Request, res: Response) => {
  const result = await StoreService.deleteStore(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getMyStore = catchAsync(async (req: Request, res: Response) => {
  const store = await StoreService.getMyStore(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your store fetched", data: store });
});