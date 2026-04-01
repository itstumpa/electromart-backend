// src/app/modules/product/product.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as ProductService from "./product.service";

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.createProduct(req.user!.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Product created successfully", data: product });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, storeId, search, minPrice, maxPrice } = req.query;
  const products = await ProductService.getAllProducts({
    categoryId: categoryId as string,
    storeId: storeId as string,
    search: search as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });
  sendResponse(res, { statusCode: 200, success: true, message: "Products fetched successfully", data: products });
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.getProductById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Product fetched successfully", data: product });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.updateProduct(req.params.id as string, req.user!.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Product updated successfully", data: product });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === "ADMIN";
  const result = await ProductService.deleteProduct(req.params.id as string, req.user!.id, isAdmin);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getMyProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getMyProducts(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your products fetched", data: products });
});