import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache, invalidateCache, invalidateCachePattern } from '../../../utils/cache';
import { paginationHelper, type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { notifyStockAlert } from '../stock-alert/stockAlert.service';

import { CacheKeys } from '../../../utils/cacheKeys';
import { generateUniqueSlug } from '../../../utils/generateUniqueSlug';
import cloudinary from '../../config/cloudinary';
import {
  formatProductDetailResponse,
  formatProductListItemResponse,
  formatProductResponse,
  PRODUCT_LIST_INCLUDE,
  type ProductWithRelations,
} from './product.formatter';

type ProductQuery = {
  includeInactive?: boolean;
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
    overview?: Record<string, unknown> | null;
    details?: Record<string, unknown> | null;
    highlights?: Record<string, unknown> | null;
    additionalInfo?: Record<string, unknown> | null;
    price: number;
    stock: number;
    categoryId: string;
    brandId?: string;
    images?: { url: string; publicId?: string | null }[];
    specifications?: { key: string; value: string }[];
    variants?: { name: string; value: string; price?: number; stock: number }[];
  }
) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, 'You need to create a store first');

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new ApiError(404, 'Category not found');

  // Validate brand if provided
  if (data.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
    });
    if (!brand) throw new ApiError(404, 'Brand not found');
  }

  const slug = await generateUniqueSlug(data.name, prisma.product);

  const { images, variants, specifications, ...productData } = data;
  const { overview: _ov, details: _det, highlights: _hl, additionalInfo: _ai, ...scalarData } = productData;

  // Destructure JSON fields out so they're not in scalarData
  const jsonFields = {
    ...(data.overview !== undefined && data.overview !== null ? { overview: data.overview as Prisma.InputJsonValue } : {}),
    ...(data.details !== undefined && data.details !== null ? { details: data.details as Prisma.InputJsonValue } : {}),
    ...(data.highlights !== undefined && data.highlights !== null ? { highlights: data.highlights as Prisma.InputJsonValue } : {}),
    ...(data.additionalInfo !== undefined && data.additionalInfo !== null ? { additionalInfo: data.additionalInfo as Prisma.InputJsonValue } : {}),
  };

  // First image becomes primary automatically; assign sequential order
  const imageData = images?.map((img, idx) => ({
    url: img.url,
    publicId: img.publicId ?? null,
    isPrimary: idx === 0, // first image is primary
    order: idx,
  }));

  const product = await prisma.product.create({
    data: {
      ...scalarData,
      ...jsonFields,
      slug,
      storeId: store.id,
      images: imageData ? { create: imageData } : undefined,
      variants: variants ? { create: variants } : undefined,
      specifications: specifications ? { create: specifications } : undefined,
    },
    include: { images: true, variants: true, category: true, brand: true, specifications: true },
  });

  // invalidate product cache
  await invalidateCachePattern('products:*');

  return formatProductResponse(product as unknown as ProductWithRelations);
};

// ─────────────────────────────────────────────
// PUBLIC — get all products (cached)
// ─────────────────────────────────────────────
export const getAllProducts = async (query: ProductQuery, options: ProductOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const cacheKey = JSON.stringify({ query, options });

  return getOrSetCache(CacheKeys.ALL_PRODUCTS(cacheKey), 120, async () => {
    const where = {
      ...(!query.includeInactive && { isActive: true }),
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
        AND: [
          {
            originalPrice: { not: null },
          },
        ],
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
          overview: true,
          details: true,
          highlights: true,
          additionalInfo: true,
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

    const data = query.onSale ? rawData.filter((p) => p.originalPrice !== null && p.originalPrice > p.price) : rawData;

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: data.map(formatProductListItemResponse),
    };
  });
};

// get products by slug

export const getProductBySlug = async (slug: string) => {
  return getOrSetCache(CacheKeys.PRODUCT_SLUG(slug), 120, async () => {
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
    120, // 2 min cache
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

  return getOrSetCache(CacheKeys.SEARCH_SUGGESTIONS(q), 120, () =>
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
    })
  );
};

// ─────────────────────────────────────────────
// UPDATE PRODUCT (invalidate cache)
// ─────────────────────────────────────────────
export const updateProduct = async (productId: string, ownerId: string, data: Record<string, unknown>, isSuperAdmin: boolean) => {
  console.log('isSuperAdmin:', isSuperAdmin);
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

  if (!isSuperAdmin && product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only update your own products');
  }

  const removeImageIds = (data.removeImageIds as string[]) || [];
  const newImages = (data.newImages as { url: string; publicId?: string | null }[]) || [];
  const primaryImageId = data.primaryImageId as string | undefined;
  const specifications = data.specifications as
    | {
        key: string;
        value: string;
      }[]
    | undefined;
  const brandId = data.brandId as string | undefined;

  // Validate brand if provided
  if (brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new ApiError(404, 'Brand not found');
  }

  // Remove helper fields so they are not spread into Prisma update data
  const { removeImageIds: _removeImageIds, newImages: _newImages, specifications: _specifications, imageUrl: _imageUrl, primaryImageId: _primaryImageId, brandId: _brandId, ...productData } = data;

  // 1. Delete selected images from Cloudinary
  if (removeImageIds.length) {
    const imagesToDelete = product.images.filter((img) => removeImageIds.includes(img.id));
    const cloudinaryResults = await Promise.allSettled(
      imagesToDelete.map((img) =>
        img.publicId ? cloudinary.uploader.destroy(img.publicId) : Promise.resolve()
      )
    );
    cloudinaryResults.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[Cloudinary] Failed to delete image ${imagesToDelete[idx]?.publicId}:`, result.reason);
      }
    });
  }

  // 2. Keep images not removed
  const remainingImages = product.images.filter((img) => !removeImageIds.includes(img.id));
  const hasExistingPrimary = remainingImages.some((img) => img.isPrimary);

  // 3. Build new image entries with proper ordering and primary assignment
  const nextOrder = remainingImages.length;
  const newImageEntries = newImages.map((img, idx) => ({
    url: img.url,
    publicId: img.publicId ?? null,
    isPrimary: !hasExistingPrimary && idx === 0 && remainingImages.length === 0,
    order: nextOrder + idx,
  }));

  // Determine which images remain (keeping their existing isPrimary status)
  const keepImageEntries = remainingImages.map((img) => ({
    id: img.id,
    url: img.url,
    publicId: img.publicId,
    isPrimary: primaryImageId ? img.id === primaryImageId : img.isPrimary,
    order: img.order,
  }));

  // If primary was deleted and no new primary set, auto-assign first available
  const finalHasPrimary = keepImageEntries.some((img) => img.isPrimary) || newImageEntries.some((img) => img.isPrimary);
  if (!finalHasPrimary && (keepImageEntries.length + newImageEntries.length) > 0) {
    if (keepImageEntries.length > 0) {
      keepImageEntries[0].isPrimary = true;
    } else if (newImageEntries.length > 0) {
      newImageEntries[0].isPrimary = true;
    }
  }

  // 4. Update product
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(productData as Record<string, unknown>),
      ...(brandId !== undefined ? { brandId } : {}),

      images: {
        deleteMany: {},
        create: [
          ...keepImageEntries.map((img) => ({
            url: img.url,
            publicId: img.publicId ?? null,
            isPrimary: img.isPrimary,
            order: img.order,
          })),
          ...newImageEntries,
        ],
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
      images: { orderBy: { order: 'asc' } },
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

  // 6. Clear cache — invalidate ALL product-related caches
  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  await invalidateCachePattern('products:*');
  await invalidateCache(CacheKeys.PRODUCT_SLUG(product.slug));
  await invalidateCache(CacheKeys.FEATURED_PRODUCTS);
  await invalidateCache(CacheKeys.BESTSELLERS);
  await invalidateCache(CacheKeys.NEW_ARRIVALS);

  return formatProductResponse(updated);
};

// ─────────────────────────────────────────────
// DELETE PRODUCT — transactional cleanup
// ─────────────────────────────────────────────
export const deleteProduct = async (productId: string, ownerId: string, isSuperAdmin: boolean) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true, images: true },
  });

  if (!product) throw new ApiError(404, 'Product not found');

  if (!isSuperAdmin && product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only delete your own products');
  }

  // 1. Delete all images from Cloudinary first
  const publicIds = product.images.filter((img) => img.publicId).map((img) => img.publicId!);

  if (publicIds.length > 0) {
    const cloudinaryResults = await Promise.allSettled(
      publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
    );

    // Log any Cloudinary failures but continue with DB deletion
    cloudinaryResults.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[Cloudinary] Failed to delete image ${publicIds[idx]}:`, result.reason);
      }
    });
  }

  // 2. Delete product from DB (cascades to ProductImage, CartItem, etc.)
  await prisma.product.delete({ where: { id: productId } });

  // 3. Clear cache
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
    include: { images: { orderBy: { order: 'asc' } }, variants: true, category: true, specifications: true },
    orderBy: { createdAt: 'desc' },
  });
};

// ─────────────────────────────────────────────
// SET PRIMARY IMAGE
// ─────────────────────────────────────────────
export const setPrimaryImage = async (imageId: string, productId: string, ownerId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true, images: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.store.ownerId !== ownerId) throw new ApiError(403, 'You can only update your own products');

  const image = product.images.find((img) => img.id === imageId);
  if (!image) throw new ApiError(404, 'Image not found on this product');

  // Use a transaction to ensure only one primary image
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  // Clear caches
  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  await invalidateCachePattern('products:*');

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { order: 'asc' },
  });
};

// ─────────────────────────────────────────────
// REORDER IMAGES
// ─────────────────────────────────────────────
export const reorderImages = async (
  productId: string,
  ownerId: string,
  imageIds: string[]
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.store.ownerId !== ownerId) throw new ApiError(403, 'You can only update your own products');

  // Validate all image IDs belong to this product
  const existingImages = await prisma.productImage.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existingImages.map((img) => img.id));
  for (const id of imageIds) {
    if (!existingIds.has(id)) throw new ApiError(400, `Image ${id} does not belong to this product`);
  }

  // Update order in a transaction
  await prisma.$transaction(
    imageIds.map((id, idx) =>
      prisma.productImage.update({
        where: { id },
        data: { order: idx },
      })
    )
  );

  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { order: 'asc' },
  });
};

// PUBLIC — featured products
export const getFeaturedProducts = async () => {
  const products = await getOrSetCache(CacheKeys.FEATURED_PRODUCTS, 600, () =>
    prisma.product.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_LIST_INCLUDE,
    })
  );
  return products.map(formatProductListItemResponse);
};

// PUBLIC — bestsellers (by order count)
export const getBestsellers = async () => {
  const products = await getOrSetCache(CacheKeys.BESTSELLERS, 600, () =>
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }],
      include: PRODUCT_LIST_INCLUDE,
    })
  );
  return products.map(formatProductListItemResponse);
};

// PUBLIC — new arrivals
export const getNewArrivals = async () => {
  const products = await getOrSetCache(CacheKeys.NEW_ARRIVALS, 600, () =>
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: PRODUCT_LIST_INCLUDE,
    })
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
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }], // prioritize popular items
    include: {
      images: { take: 1 },
      category: { select: { name: true, slug: true } },
      store: { select: { id: true, name: true } },
    },
  });
};
