// src/app/modules/category/category.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as CategoryService from "./category.service";

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.createCategory(req.body.name);
  sendResponse(res, { statusCode: 201, success: true, message: "Category created", data: category });
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await CategoryService.getAllCategories();
  sendResponse(res, { statusCode: 200, success: true, message: "Categories fetched", data: categories });
});

export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.getCategoryById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Category fetched", data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.updateCategory(req.params.id as string, req.body.name);
  sendResponse(res, { statusCode: 200, success: true, message: "Category updated", data: category });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.deleteCategory(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});