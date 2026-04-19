// src/app/modules/product/product.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as ProductService from "./product.service";
import { IOptions } from "../../shared/paginationHelper";

export const searchProducts = catchAsync(async (req: Request, res: Response) => {
  const { q, categoryId, minPrice, maxPrice, page, limit, sortBy, sortOrder } = req.query;
  const result = await ProductService.searchProducts(
    {
      q: q as string,
      categoryId: categoryId as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    },
    { page, limit, sortBy, sortOrder } as IOptions
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Search results", meta: result.meta, data: result.data });
});

export const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const suggestions = await ProductService.getSearchSuggestions(req.query.q as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Suggestions", data: suggestions });
});

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