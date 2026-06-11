import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache, invalidateCache, invalidateCachePattern } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';
import { paginationHelper, type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
// ─────────────────────────────────────────────
// CUSTOMER — create review
// ─────────────────────────────────────────────
export const createReview = async (customerId: string, productId: string, data: { rating: number; comment?: string }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });

  if (!product) throw new ApiError(404, 'Product not found');

  if (product.store.ownerId === customerId) {
    throw new ApiError(403, 'You cannot review your own product');
  }

  const deliveredOrderItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: customerId,
        status: 'DELIVERED',
      },
    },
  });

  if (!deliveredOrderItem) {
    throw new ApiError(403, 'You can only review purchased and delivered products');
  }

  const existing = await prisma.review.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });

  if (existing) {
    throw new ApiError(409, 'Already reviewed');
  }

  const review = await prisma.review.create({
    data: { customerId, productId, ...data },
  });

  await updateProductStats(productId);

  // invalidate product reviews cache
  await invalidateCachePattern(`reviews:product:${productId}:*`);

  return review;
};

// ─────────────────────────────────────────────
// PUBLIC — get product reviews (cached)
// ─────────────────────────────────────────────
export const getProductReviews = async (productId: string, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const cacheKey = `${productId}:${page}:${limit}:${sortBy}:${sortOrder}`;

  return getOrSetCache(CacheKeys.PRODUCT_REVIEWS(cacheKey), 60, async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { rating: true },
    });

    if (!product) throw new ApiError(404, 'Product not found');

    const where = { productId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: {
        reviews,
        averageRating: Number((product?.rating ?? 0).toFixed(1)),
        totalReviews: total,
      },
    };
  });
};

// ─────────────────────────────────────────────
// CUSTOMER — update review
// ─────────────────────────────────────────────
export const updateReview = async (reviewId: string, customerId: string, data: { rating?: number; comment?: string }) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new ApiError(404, 'Review not found');

  if (review.customerId !== customerId) {
    throw new ApiError(403, 'Not allowed');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
  });

  await updateProductStats(review.productId);

  await invalidateCachePattern(`reviews:product:${review.productId}:*`);

  return updated;
};

// ─────────────────────────────────────────────
// DELETE REVIEW
// ─────────────────────────────────────────────
export const deleteReview = async (reviewId: string, requesterId: string, isAdmin: boolean) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new ApiError(404, 'Review not found');

  if (!isAdmin && review.customerId !== requesterId) {
    throw new ApiError(403, 'Not allowed');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  await updateProductStats(review.productId);

  await invalidateCachePattern(`reviews:product:${review.productId}:*`);

  return { message: 'Deleted successfully' };
};

// ─────────────────────────────────────────────
// CUSTOMER — my reviews (NO cache needed)
// ─────────────────────────────────────────────
export const getMyReviews = async (customerId: string) => {
  return prisma.review.findMany({
    where: { customerId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ─────────────────────────────────────────────
// PUBLIC — latest reviews across all products
// ─────────────────────────────────────────────
export const getLatestReviews = async (limit = 10) => {
  return prisma.review.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, avatar: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { take: 1 },
        },
      },
    },
  });
};

const updateProductStats = async (productId: string) => {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      reviewCount,
    },
  });

  await invalidateCache(CacheKeys.SINGLE_PRODUCT(productId));
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product?.slug) {
    await invalidateCache(CacheKeys.PRODUCT_SLUG(product.slug));
  }
  
  await invalidateCachePattern('products:list:*');
  await invalidateCachePattern('products:search:*');
  await invalidateCache(CacheKeys.FEATURED_PRODUCTS);
  await invalidateCache(CacheKeys.BESTSELLERS);
  await invalidateCache(CacheKeys.NEW_ARRIVALS);
};
