// src/app/modules/coupon/coupon.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as CouponService from "./coupon.service";

export const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await CouponService.createCoupon(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Coupon created", data: coupon });
});

export const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const coupons = await CouponService.getAllCoupons();
  sendResponse(res, { statusCode: 200, success: true, message: "Coupons fetched", data: coupons });
});

export const getPromotionalCoupons = catchAsync(async (req: Request, res: Response) => {
  const coupons = await CouponService.getPromotionalCoupons();
  sendResponse(res, { statusCode: 200, success: true, message: "Promotions fetched", data: coupons });
});

export const toggleCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await CouponService.toggleCoupon(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Coupon toggled", data: coupon });
});

export const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await CouponService.updateCoupon(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Coupon updated", data: coupon });
});

export const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.deleteCoupon(req.params.id  as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const applyCouponToCart = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.applyCouponToCart(req.user!.id, req.body.code);
  sendResponse(res, { statusCode: 200, success: true, message: "Coupon applied", data: result });
});