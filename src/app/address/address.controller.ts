// src/app/modules/address/address.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import * as AddressService from "./address.service";

export const createAddress = catchAsync(async (req: Request, res: Response) => {
  const data = await AddressService.createAddress(req.user!.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Address added", data });
});

export const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
  const data = await AddressService.getMyAddresses(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Addresses fetched", data });
});

export const getAddressById = catchAsync(async (req: Request, res: Response) => {
  const data = await AddressService.getAddressById(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Address fetched", data });
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const data = await AddressService.updateAddress(req.params.id  as string, req.user!.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Address updated", data });
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.deleteAddress(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
  const data = await AddressService.setDefaultAddress(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Default address updated", data });
});