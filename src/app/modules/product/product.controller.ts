// src/app/modules/product/product.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import * as ProductService from "./product.service";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../utils/uploadToCloudinary";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
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



export const uploadProductImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new ApiError(400, "No images provided");

  // verify product belongs to this vendor
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, "Product not found");
  if (product.store.ownerId !== req.user!.id) {
    throw new ApiError(403, "You can only upload images to your own products");
  }

  // upload all files to cloudinary in parallel
  const uploads = await Promise.all(
    files.map((file) =>
      uploadToCloudinary(file.buffer, `electromart/products`)
    )
  );

  // save image records to DB
  const images = await prisma.$transaction(
    uploads.map((result) =>
      prisma.productImage.create({
        data: {
          url: result.secure_url,
          publicId: result.public_id,  // save for deletion later
          productId: product.id,
        },
      })
    )
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `${images.length} image(s) uploaded successfully`,
    data: images,
  });
});

export const deleteProductImage = catchAsync(async (req: Request, res: Response) => {
  const image = await prisma.productImage.findUnique({
    where: { id: req.params.imageId as string },
    include: { product: { include: { store: true } } },
  });

  if (!image) throw new ApiError(404, "Image not found");
  if (image.product.store.ownerId !== req.user!.id) {
    throw new ApiError(403, "You can only delete images from your own products");
  }

  // delete from cloudinary then DB
  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }
  await prisma.productImage.delete({ where: { id: image.id } });

  sendResponse(res, { statusCode: 200, success: true, message: "Image deleted", data: null });
});