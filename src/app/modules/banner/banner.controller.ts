import { Request, Response } from 'express';
import { BannerType } from '@prisma/client';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import * as BannerService from './banner.service';

// ── Public ───────────────────────────────────────────────────
export const getActiveBannersByType = catchAsync(
  async (req: Request, res: Response) => {
    const type = req.query.type as BannerType;
    const banners = await BannerService.getActiveBannersByType(type);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Banners fetched successfully',
      data: banners,
    });
  },
);

// ── Admin ────────────────────────────────────────────────────
export const getAllBanners = catchAsync(
  async (_req: Request, res: Response) => {
    const banners = await BannerService.getAllBanners();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'All banners fetched successfully',
      data: banners,
    });
  },
);

export const getBannerById = catchAsync(
  async (req: Request, res: Response) => {
    const banner = await BannerService.getBannerById(req.params.id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Banner fetched successfully',
      data: banner,
    });
  },
);

export const createBanner = catchAsync(
  async (req: Request, res: Response) => {
    const banner = await BannerService.createBanner(req.body, req.file);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  },
);

export const updateBanner = catchAsync(
  async (req: Request, res: Response) => {
    const banner = await BannerService.updateBanner(
      req.params.id as string,
      req.body,
      req.file,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  },
);

export const deleteBanner = catchAsync(
  async (req: Request, res: Response) => {
    await BannerService.deleteBanner(req.params.id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Banner deleted successfully',
      data: null,
    });
  },
);
