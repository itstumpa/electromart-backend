// src/app/modules/review/review.service.ts
import { prisma } from "../../lib/prisma";
import ApiError from "../../utils/apiErrors";
import { IOptions, paginationHelper } from "../shared/paginationHelper";

// CUSTOMER — create review (must have delivered order item for this product)
export const createReview = async (
  customerId: string,
  productId: string,
  data: { rating: number; comment?: string }
) => {
  // check product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, "Product not found");

  // vendor cannot review their own product
  if (product.store.ownerId === customerId) {
    throw new ApiError(403, "You cannot review your own product");
  }

  // must have a DELIVERED order item for this product
  const deliveredOrderItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      status: "DELIVERED",
      order: { customerId },
    },
  });
  if (!deliveredOrderItem) {
    throw new ApiError(
      403,
      "You can only review products you have purchased and received"
    );
  }

  // one review per product per customer
  const existingReview = await prisma.review.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });
  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  return prisma.review.create({
    data: { customerId, productId, ...data },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });
};

// PUBLIC — get all reviews for a product
export const getProductReviews = async (
  productId: string,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");

  const where = { productId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: {
      reviews,
      averageRating: Number(avgRating.toFixed(1)),
      totalReviews: total,
    },
  };
};

// CUSTOMER — get own reviews
export const getMyReviews = async (customerId: string) => {
  return prisma.review.findMany({
    where: { customerId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// CUSTOMER — update own review
export const updateReview = async (
  reviewId: string,
  customerId: string,
  data: { rating?: number; comment?: string }
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.customerId !== customerId) {
    throw new ApiError(403, "You can only edit your own reviews");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      customer: { select: { id: true, name: true } },
    },
  });
};

// CUSTOMER/ADMIN — delete review
export const deleteReview = async (
  reviewId: string,
  requesterId: string,
  isAdmin: boolean
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, "Review not found");

  if (!isAdmin && review.customerId !== requesterId) {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return { message: "Review deleted successfully" };
};