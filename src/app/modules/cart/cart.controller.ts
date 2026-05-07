// src/app/modules/cart/cart.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as CartService from "./cart.service";

export const viewCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.viewCart(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Cart fetched", data: cart });
});

export const addToCart = catchAsync(async (req: Request, res: Response) => {
  const { productId, quantity, variantId } = req.body;
  const cart = await CartService.addToCart(req.user!.id, productId, quantity, variantId);
  sendResponse(res, { statusCode: 200, success: true, message: "Item added to cart", data: cart });
});

export const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.updateCartItem(
    req.user!.id,
    req.params.productId as string,
    req.body.quantity,
    req.body.variantId,
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Cart updated", data: cart });
});

export const removeFromCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.removeFromCart(req.user!.id, req.params.productId as string, req.body.variantId);
  sendResponse(res, { statusCode: 200, success: true, message: "Item removed", data: cart });
});

export const clearCart = catchAsync(async (req: Request, res: Response) => {
  const result = await CartService.clearCart(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const mergeCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.mergeCart(req.user!.id, req.body.items);
  sendResponse(res, { statusCode: 200, success: true, message: "Cart merged successfully", data: cart });
});