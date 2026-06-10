// src/app/modules/product/product.controller.ts
import { NextFunction, Request, Response } from 'express';
import { uploadQueue } from '../../../jobs/queues/upload.queue';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import catchAsync from '../../../utils/catchAsync';
import { generateUniqueSlug } from '../../../utils/generateUniqueSlug';
import { type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { addRecentlyViewed, getRecentlyViewed } from '../../../utils/recentlyViewed';
import sendResponse from '../../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../../utils/uploadToCloudinary';
import * as ProductService from './product.service';

export type ProductQuery = {
  categoryId?: string;
  storeId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductInclude = {
  images: true;
  brand: true;
  category: true;
};

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
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Search results',
    meta: result.meta,
    data: result.data,
  });
});

export const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const suggestions = await ProductService.getSearchSuggestions(req.query.q as string);
  sendResponse(res, { statusCode: 200, success: true, message: 'Suggestions', data: suggestions });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const slug = await generateUniqueSlug(req.body.name, prisma.product as any);

  let images: { url: string }[] = [];
  req.body.price = Number(req.body.price);
  req.body.stock = Number(req.body.stock);

  if (files?.length) {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const result: any = await uploadToCloudinary(file.buffer, 'products');
        return { url: result.secure_url };
      })
    );
    images = uploaded;
  }

  const variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;

  const product = await ProductService.createProduct(req.user!.id, {
    ...req.body,
    slug,
    images,
    variants,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

export const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.getProductBySlug(req.params.slug as string);
  if (req.user?.id) {
    await addRecentlyViewed(req.user.id, product.id).catch(() => {});
  }
  sendResponse(res, { statusCode: 200, success: true, message: 'Product fetched successfully', data: product });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, storeId, search, minPrice, maxPrice, page, limit, sortBy, sortOrder, onSale } = req.query;
  
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role as string ?? '');

  const result = await ProductService.getAllProducts(
    {
      categoryId: categoryId ? String(categoryId) : undefined,
      storeId: storeId ? String(storeId) : undefined,
      search: search ? String(search) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      includeInactive: isAdmin,
      onSale: onSale === 'true',
    },
    {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy ? String(sortBy) : 'createdAt',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    }
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.getProductById(req.params.id as string);
  if (req.user?.id) {
    await addRecentlyViewed(req.user.id, req.params.id as string).catch(() => {}); // silent fail
  }
  sendResponse(res, { statusCode: 200, success: true, message: 'Product fetched successfully', data: product });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
  const removeImageIds = typeof body.removeImageIds === 'string' ? JSON.parse(body.removeImageIds) : body.removeImageIds || [];

  let newImages: { url: string; publicId: string }[] = [];
  if (files.length) {
    newImages = await Promise.all(
      files.map(async (file) => {
        const result: any = await uploadToCloudinary(file.buffer, 'products');
        return { url: result.secure_url, publicId: result.public_id };
      })
    );
  }

 const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role as string);
const product = await ProductService.updateProduct(
  req.params.id as string,
  req.user!.id,
  { ...body, removeImageIds, newImages },
  isAdmin,
);

  sendResponse(res, { statusCode: 200, success: true, message: 'Product updated successfully', data: product });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const result = await ProductService.deleteProduct(req.params.id as string, req.user!.id, isAdmin);
  sendResponse(res, { statusCode: 200, success: true, message: result.message, data: null });
});

export const getMyProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getMyProducts(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Your products fetched', data: products });
});

export const uploadProductImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new ApiError(400, 'No images provided');

  // verify product belongs to this vendor
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.store.ownerId !== req.user!.id) {
    throw new ApiError(403, 'You can only upload images to your own products');
  }

  // queue each upload — return immediately
  const jobs = await Promise.all(
    files.map((file, index) =>
      uploadQueue.add(`upload-${index}`, {
        fileBuffer: file.buffer.toString('base64'), // serialize for queue
        folder: 'electromart/products',
        productId: product.id,
        ownerId: req.user!.id,
      })
    )
  );

  // upload all files to cloudinary in parallel
  const uploads = await Promise.all(files.map((file) => uploadToCloudinary(file.buffer, `electromart/products`)));

  // save image records to DB
  const images = await prisma.$transaction(
    uploads.map((result) =>
      prisma.productImage.create({
        data: {
          url: result.secure_url,
          publicId: result.public_id, // save for deletion later
          productId: product.id,
        },
      })
    )
  );

  sendResponse(res, {
    statusCode: 202,
    success: true,
    message: `${images.length} image(s) queued for upload. They will appear shortly.`,
    data: { jobIds: jobs.map((j) => j.id) },
  });
});

export const deleteProductImage = catchAsync(async (req: Request, res: Response) => {
  const image = await prisma.productImage.findUnique({
    where: { id: req.params.imageId as string },
    include: { product: { include: { store: true } } },
  });

  if (!image) throw new ApiError(404, 'Image not found');
  if (image.product.store.ownerId !== req.user!.id) {
    throw new ApiError(403, 'You can only delete images from your own products');
  }

  // delete from cloudinary then DB
  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }
  await prisma.productImage.delete({ where: { id: image.id } });

  sendResponse(res, { statusCode: 200, success: true, message: 'Image deleted', data: null });
});

export const getRecentlyViewedProducts = catchAsync(async (req: Request, res: Response) => {
  const data = await getRecentlyViewed(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Recently viewed', data });
});

export const getFeaturedProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getFeaturedProducts();
  sendResponse(res, { statusCode: 200, success: true, message: 'Featured products', data: products });
});

export const getBestsellers = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getBestsellers();
  sendResponse(res, { statusCode: 200, success: true, message: 'Bestsellers', data: products });
});

export const getNewArrivals = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getNewArrivals();
  sendResponse(res, { statusCode: 200, success: true, message: 'New arrivals', data: products });
});

export const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductService.getRecommendations(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: 'Recommendations', data: products });
});

export const getAllProductsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductService.getAllProducts(
      { ...req.query, includeInactive: true },  // force include inactive
      req.query
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
