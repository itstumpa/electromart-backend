// src/app/modules/cart/cart.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as CartService from "./cart.service";

/** Resolve the cart owner discriminator from the request */
const resolveOwner = (req: Request): { userId: string } | { guestId: string } => {
  if (req.user?.id) return { userId: req.user.id };
  if (req.user?.guestId) return { guestId: req.user.guestId };
  throw new Error("No authenticated user or guest session");
};

export const viewCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.viewCart(resolveOwner(req));
  sendResponse(res, { statusCode: 200, success: true, message: "Cart fetched", data: cart });
});

export const addToCart = catchAsync(async (req: Request, res: Response) => {
  const { productId, quantity, variantId } = req.body;
  const cart = await CartService.addToCart(resolveOwner(req), productId, quantity, variantId);
  sendResponse(res, { statusCode: 200, success: true, message: "Item added to cart", data: cart });
});

export const addToCartByProductId = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const quantity = req.body?.quantity ?? 1;
  const variantId = req.body?.variantId as string | undefined;
  const cart = await CartService.addToCart(resolveOwner(req), productId, quantity, variantId);
  sendResponse(res, { statusCode: 200, success: true, message: "Item added to cart", data: cart });
});

export const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.updateCartItem(
    resolveOwner(req),
    req.params.productId as string,
    req.body.quantity,
    req.body.variantId,
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Cart updated", data: cart });
});

export const removeFromCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.removeFromCart(resolveOwner(req), req.params.productId as string, req.body?.variantId);
  sendResponse(res, { statusCode: 200, success: true, message: "Item removed", data: cart });
});

export const clearCart = catchAsync(async (req: Request, res: Response) => {
  const result = await CartService.clearCart(resolveOwner(req));
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const mergeCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.mergeCart(req.user!.id, req.body.items);
  sendResponse(res, { statusCode: 200, success: true, message: "Cart merged successfully", data: cart });
});

export const applyCartCoupon = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.applyCartCoupon(resolveOwner(req), req.body.code);
  sendResponse(res, { statusCode: 200, success: true, message: "Coupon applied", data: cart });
});

export const removeCartCoupon = catchAsync(async (req: Request, res: Response) => {
  const cart = await CartService.removeCartCoupon(resolveOwner(req));
  sendResponse(res, { statusCode: 200, success: true, message: "Coupon removed", data: cart });
});