import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as TagService from "./tag.service";

export const createTag = catchAsync(async (req: Request, res: Response) => {
  const data = await TagService.createTag(req.body.name);
  sendResponse(res, { statusCode: 201, success: true, message: "Tag created", data });
});

export const getAllTags = catchAsync(async (req: Request, res: Response) => {
  const data = await TagService.getAllTags();
  sendResponse(res, { statusCode: 200, success: true, message: "Tags fetched", data });
});

export const deleteTag = catchAsync(async (req: Request, res: Response) => {
  const result = await TagService.deleteTag(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const addTagsToProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await TagService.addTagsToProduct(req.params.productId as string, req.user!.id, req.body.tagIds);
  sendResponse(res, { statusCode: 200, success: true, message: "Tags added to product", data });
});

export const removeTagFromProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await TagService.removeTagFromProduct(req.params.productId as string, req.params.tagId as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getProductsByTag = catchAsync(async (req: Request, res: Response) => {
  const data = await TagService.getProductsByTag(req.params.slug as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Products by tag", data });
});