// src/app/modules/category/category.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as CategoryService from "./category.service";

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, image: bodyImage, isFeatured } = req.body;

  const files = (req.files as Express.Multer.File[]) || [];

  const image = files[0]?.path || bodyImage;

  const category = await CategoryService.createCategory(
    name,
    image,
    isFeatured
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Category created",
    data: category,
  });
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await CategoryService.getAllCategories();
  sendResponse(res, { statusCode: 200, success: true, message: "Categories fetched", data: categories });
});

export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.getCategoryById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Category fetched", data: category });
});

export const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.getCategoryBySlug(req.params.slug as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Category fetched", data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, image: bodyImage, isFeatured } = req.body;

  const files = (req.files as Express.Multer.File[]) || [];

  const image = files[0]?.path || bodyImage;

  const result = await CategoryService.updateCategory(
    id as string,
    name,
    image,
    isFeatured
  );

  sendResponse(res, {
    success: true,
    data: result,
    statusCode: 200,
    message: "Category Updated"
  });
});

export const getFeaturedCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await CategoryService.getFeaturedCategories();
  sendResponse(res, { statusCode: 200, success: true, message: "Featured categories fetched", data: categories });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.deleteCategory(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});