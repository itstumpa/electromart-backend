import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache, invalidateCache, invalidateCachePattern } from '../../../utils/cache';
import { paginationHelper, type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { notifyStockAlert } from '../stock-alert/stockAlert.service';

import { CacheKeys } from '../../../utils/cacheKeys';
import {
  formatProductDetailResponse,
  formatProductListItemResponse,
  formatProductListResponse,
  formatProductResponse,
  PRODUCT_LIST_INCLUDE,
} from './product.formatter';
import cloudinary from '../../config/cloudinary';
import { generateUniqueSlug } from '../../../utils/generateUniqueSlug';

type ProductQuery = {
  categoryId?: string;
  storeId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
};

type ProductOptions = IOptions;

type ProductTag = {
  id: string;
  name: string;
};
type ProductSpecificationInput = {
  key: string;
  value: string;
};
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

  const slug = await generateUniqueSlug(data.name, prisma.product);

  const { images, variants, ...productData } = data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      storeId: store.id,
      images: images ? { create: images } : undefined,
      variants: variants ? { create: variants } : undefined,
    },
    include: { images: true, variants: true, category: true, brand: true, specifications: true },
  });

  // invalidate product cache
  await invalidateCachePattern('products:*');

  return formatProductResponse(product);
};

// ─────────────────────────────────────────────
// PUBLIC — get all products (cached)
// ─────────────────────────────────────────────
export const getAllProducts = async (query: ProductQuery, options: ProductOptions) => {
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

          ...(query.onSale && {
    originalPrice: { not: null },
    AND: [{
      originalPrice: { not: null },
    }],
  }),
};

const [rawData, total] = await Promise.all([
prisma.product.findMany({
  where,
  select: {
    id: true,
    name: true,
    slug: true,
    description: true,
    price: true,
    originalPrice: true, 
    stock: true,
    storeId: true,
    categoryId: true,
    isActive: true,
    rating: true,          
    reviewCount: true,
    featured: true,
    bestseller: true,
    createdAt: true,
    updatedAt: true,
    images: { select: { id: true, url: true } },
    category: { select: { id: true, name: true, slug: true } },
    store: { select: { id: true, name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true } },
  },
  orderBy: { [sortBy]: sortOrder },
  skip,
  take: limit,
}),
  prisma.product.count({ where }),
]);

const data = query.onSale
  ? rawData.filter(
      (p) => p.originalPrice !== null && p.originalPrice > p.price
    )
  : rawData;

      return {
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data: data.map(formatProductListItemResponse),
      };
    }
  );
};

// get products by slug

export const getProductBySlug = async (slug: string) => {
  return getOrSetCache(CacheKeys.PRODUCT_SLUG(slug), 600, async () => {
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        variants: true,
        category: true,
        brand: true,
        tags: {
          include: {
            tag: true,
          },
        },
        specifications: true,
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: slug },
        include: {
          images: true,
          variants: true,
          category: true,
          brand: true,
          tags: {
            include: {
              tag: true,
            },
          },
          specifications: true,
          store: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    }

    if (!product) throw new ApiError(404, 'Product not found');
    if (!product.slug) throw new ApiError(500, 'Product slug missing');

    return formatProductDetailResponse(product);
  });
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
          brand: true,
          tags: {
            include: {
              tag: true,
            },
          },
          specifications: true,
          store: {
            select: { id: true, name: true, slug: true },
          },
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
          include: PRODUCT_LIST_INCLUDE,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        data: data.map(formatProductListItemResponse),
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
      select: {
        id: true,
        name: true,
        images: { select: { url: true } },
      },
      take: 8,
    }),
  );
};

// ─────────────────────────────────────────────
// UPDATE PRODUCT (invalidate cache)
// ─────────────────────────────────────────────
export const updateProduct = async (productId: string, ownerId: string, data: Record<string, unknown>) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      store: true,
      images: true,
      variants: true,
      specifications: true,
    },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only update your own products');
  }

  const removeImageIds = (data.removeImageIds as string[]) || [];
  const newImages = (data.newImages as { url: string; publicId?: string | null }[]) || [];
  const specifications = data.specifications as
    | {
        key: string;
        value: string;
      }[]
    | undefined;

  // Remove helper fields so they are not spread into Prisma update data
  const { removeImageIds: _removeImageIds, newImages: _newImages, specifications: _specifications, ...productData } = data;

  // 1. Delete selected images from Cloudinary
  if (removeImageIds.length) {
    await Promise.all(removeImageIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
  }

  // 2. Keep images not removed
  const remainingImages = product.images.filter((img) => !removeImageIds.includes(img.publicId ?? ''));

  // 3. Merge existing + new images
  const finalImages = [...remainingImages, ...newImages];

  // 4. Update product
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(productData as Record<string, unknown>),

      images: {
        deleteMany: {},
        create: finalImages.map((img) => ({
          url: img.url,
          publicId: img.publicId ?? null,
        })),
      },

      specifications:
        specifications !== undefined
          ? {
              deleteMany: {},
              create: specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
              })),
            }
          : undefined,
    },

    include: {
      images: true,
      variants: true,
      specifications: true,
      category: true,
      brand: true,
    },
  });

  // 5. Notify if restocked
  if (typeof data.stock === 'number' && product.stock <= 0 && data.stock > 0) {
    await notifyStockAlert(productId);
  }

  // 6. Clear cache
  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  await invalidateCachePattern('products:*');

  return formatProductResponse(updated);
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

// PUBLIC — featured products
export const getFeaturedProducts = async () => {
  const products = await getOrSetCache(CacheKeys.FEATURED_PRODUCTS, 3600, () =>
    prisma.product.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_LIST_INCLUDE,
    }),
  );
  return products.map(formatProductListItemResponse);
};

// PUBLIC — bestsellers (by order count)
export const getBestsellers = async () => {
  const products = await getOrSetCache(CacheKeys.BESTSELLERS, 1800, () =>
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { rating: 'desc', reviewCount: 'desc', createdAt: 'desc' },
      include: PRODUCT_LIST_INCLUDE,
    }),
  );
  return products.map(formatProductListItemResponse);
};

// PUBLIC — new arrivals
export const getNewArrivals = async () => {
  const products = await getOrSetCache(CacheKeys.NEW_ARRIVALS, 1800, () =>
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_LIST_INCLUDE,
    }),
  );
  return products.map(formatProductListItemResponse);
};

// PUBLIC — recommendations based on product
export const getRecommendations = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      NOT: { id: productId }, // exclude current product
    },
    take: 8,
    orderBy: { rating: 'desc', reviewCount: 'desc', createdAt: 'desc' }, // prioritize popular items
    include: {
      images: { take: 1 },
      category: { select: { name: true, slug: true } },
      store: { select: { id: true, name: true } },
    },
  });
};
