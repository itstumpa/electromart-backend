import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as WishlistService from "./wishlist.service";

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const items = await WishlistService.getWishlist(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wishlist fetched",
    data: items,
  });
});

export const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  const items = await WishlistService.addToWishlist(
    req.user!.id,
    req.params.productId as string,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Added to wishlist",
    data: items,
  });
});

export const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  const items = await WishlistService.removeFromWishlist(
    req.user!.id,
    req.params.productId as string,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Removed from wishlist",
    data: items,
  });
});

export const clearWishlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistService.clearWishlist(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const checkWishlistItem = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistService.checkWishlistItem(
    req.user!.id,
    req.params.productId as string,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wishlist status fetched",
    data: result,
  });
});
