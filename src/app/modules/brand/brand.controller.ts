import { Request, Response } from 'express';
import * as BrandService from './brand.service';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';

export const getAllBrands = catchAsync(async (_req: Request, res: Response) => {
  const brands = await BrandService.getAllBrands();
  sendResponse(res, { statusCode: 200, success: true, message: 'Brands fetched', data: brands });
});

export const getFeaturedBrands = catchAsync(async (_req: Request, res: Response) => {
  const brands = await BrandService.getFeaturedBrands();
  sendResponse(res, { statusCode: 200, success: true, message: 'Featured brands fetched', data: brands });
});

export const getBrandById = catchAsync(async (req: Request, res: Response) => {
  const brand = await BrandService.getBrandById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: 'Brand fetched', data: brand });
});

export const createBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await BrandService.createBrand(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: 'Brand created', data: brand });
});

export const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await BrandService.updateBrand(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Brand updated', data: brand });
});

export const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  await BrandService.deleteBrand(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: 'Brand deleted', data: null });
});