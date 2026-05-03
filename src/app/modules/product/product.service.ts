import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { IOptions, paginationHelper } from '../../shared/paginationHelper';
import { notifyStockAlert } from '../stock-alert/stockAlert.service';
import { getOrSetCache, invalidateCache, invalidateCachePattern } from '../../../utils/cache';

import { CacheKeys } from '../../../utils/cacheKeys';
import cloudinary from '../../config/cloudinary';

// ─────────────────────────────────────────────
// VENDOR — create product
// ─────────────────────────────────────────────
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
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, 'You need to create a store first');

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new ApiError(404, 'Category not found');

  const { images, variants, ...productData } = data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      storeId: store.id,
      images: images ? { create: images } : undefined,
      variants: variants ? { create: variants } : undefined,
    },
    include: { images: true, variants: true, category: true },
  });

  // invalidate product cache
  await invalidateCachePattern('products:*');

  return product;
};

// ─────────────────────────────────────────────
// PUBLIC — get all products (cached)
// ─────────────────────────────────────────────
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
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const cacheKey = JSON.stringify({ query, options });

  return getOrSetCache(
    CacheKeys.ALL_PRODUCTS(cacheKey),
    300, // 5 min cache
    async () => {
      const where = {
        isActive: true,
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(query.storeId && { storeId: query.storeId }),
        ...(query.search && {
          name: { contains: query.search, mode: 'insensitive' as const },
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
    }
  );
};

// ─────────────────────────────────────────────
// PUBLIC — get single product (cached)
// ─────────────────────────────────────────────
export const getProductById = async (id: string) => {
  return getOrSetCache(
    CacheKeys.SINGLE_PRODUCT(id),
    600, // 10 min cache
    async () => {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          variants: true,
          category: true,
          store: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!product) throw new ApiError(404, 'Product not found');
      return product;
    }
  );
};

// ─────────────────────────────────────────────
// SEARCH — cached (short TTL)
// ─────────────────────────────────────────────
export const searchProducts = async (query: any, options: IOptions) => {
  const cacheKey = JSON.stringify({ query, options });

  return getOrSetCache(
    CacheKeys.SEARCH_PRODUCTS(cacheKey),
    120, // 2 min
    async () => {
      const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

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
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { category: { name: { contains: query.q, mode: 'insensitive' } } },
            { store: { name: { contains: query.q, mode: 'insensitive' } } },
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
    }
  );
};

// ─────────────────────────────────────────────
// SEARCH SUGGESTIONS (cached)
// ─────────────────────────────────────────────
export const getSearchSuggestions = async (q: string) => {
  if (!q || q.length < 2) return [];

  return getOrSetCache(CacheKeys.SEARCH_SUGGESTIONS(q), 300, () =>
    prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, images: { take: 1 } },
      take: 8,
    })
  );
};

// ─────────────────────────────────────────────
// UPDATE PRODUCT (invalidate cache)
// ─────────────────────────────────────────────
export const updateProduct = async (productId: string, ownerId: string, data: any) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });

  if (!product) throw new ApiError(404, 'Product not found');

  if (product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only update your own products');
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
  });

  // notify only when stock was previously empty and now restocked
  if (typeof data.stock === 'number' && product.stock <= 0 && data.stock > 0) {
    await notifyStockAlert(productId);
  }

  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  await invalidateCachePattern('products:*');

  return updated;
};

// ─────────────────────────────────────────────
// DELETE PRODUCT (invalidate cache)
// ─────────────────────────────────────────────
export const deleteProduct = async (productId: string, ownerId: string, isAdmin: boolean) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });

  if (!product) throw new ApiError(404, 'Product not found');

  if (!isAdmin && product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only delete your own products');
  }

  await prisma.product.delete({ where: { id: productId } });

  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  await invalidateCachePattern('products:*');

  return { message: 'Product deleted successfully' };
};

// ─────────────────────────────────────────────
// VENDOR PRODUCTS (optional cache)
// ─────────────────────────────────────────────
export const getMyProducts = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "You don't have a store yet");

  return prisma.product.findMany({
    where: { storeId: store.id },
    include: { images: true, variants: true, category: true },
    orderBy: { createdAt: 'desc' },
  });
};
