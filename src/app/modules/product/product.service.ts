// src/app/modules/product/product.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import { IOptions, paginationHelper } from "../../shared/paginationHelper";


// FULL-TEXT SEARCH
export const searchProducts = async (
  query: { q?: string; categoryId?: string; minPrice?: number; maxPrice?: number },
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: any = {
    isActive: true,
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...((query.minPrice || query.maxPrice) && {
      price: {
        ...(query.minPrice && { gte: query.minPrice }),
        ...(query.maxPrice && { lte: query.maxPrice }),
      },
    }),
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { category: { name: { contains: query.q, mode: "insensitive" } } },
        { store: { name: { contains: query.q, mode: "insensitive" } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { take: 1 },
        category: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// AUTOCOMPLETE — returns just names, fast
export const getSearchSuggestions = async (q: string) => {
  if (!q || q.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, images: { take: 1 } },
    take: 8, // max 8 suggestions
  });

  return products;
};

// VENDOR — create product in their store
export const createProduct = async (
  ownerId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: string;
    images?: { url: string }[];
    variants?: { name: string; value: string; price?: number; stock: number }[];
  }
) => {
  // make sure vendor has a store
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "You need to create a store first");

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new ApiError(404, "Category not found");

  const { images, variants, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      storeId: store.id,
      images: images ? { create: images } : undefined,
      variants: variants ? { create: variants } : undefined,
    },
    include: { images: true, variants: true, category: true },
  });
};

// PUBLIC — get all active products (with filters)
export const getAllProducts = async (
  query: {
    categoryId?: string;
    storeId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  },
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where = {
    isActive: true,
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.storeId && { storeId: query.storeId }),
    ...(query.search && {
      name: { contains: query.search, mode: "insensitive" as const },
    }),
    ...((query.minPrice || query.maxPrice) && {
      price: {
        ...(query.minPrice && { gte: query.minPrice }),
        ...(query.maxPrice && { lte: query.maxPrice }),
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: true,
        category: true,
        store: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

// PUBLIC — get single product
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      variants: true,
      category: true,
      store: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!product) throw new ApiError(404, "Product not found");
  return product;
};

// VENDOR — update own product only
export const updateProduct = async (
  productId: string,
  ownerId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string;
    isActive?: boolean;
  }
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, "Product not found");

  if (product.store.ownerId !== ownerId) {
    throw new ApiError(403, "You can only update your own products");
  }

  return prisma.product.update({
    where: { id: productId },
    data,
    include: { images: true, variants: true },
  });
};

// VENDOR/ADMIN — delete product
export const deleteProduct = async (productId: string, ownerId: string, isAdmin: boolean) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, "Product not found");

  if (!isAdmin && product.store.ownerId !== ownerId) {
    throw new ApiError(403, "You can only delete your own products");
  }

  await prisma.product.delete({ where: { id: productId } });
  return { message: "Product deleted successfully" };
};

// VENDOR — get all their products
export const getMyProducts = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "You don't have a store yet");

  return prisma.product.findMany({
    where: { storeId: store.id },
    include: { images: true, variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });
};