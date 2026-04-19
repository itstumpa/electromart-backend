// src/app/modules/coupon/coupon.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

// ADMIN — create coupon
export const createCoupon = async (data: {
  code: string;
  discountPercent: number;
}) => {
  const existing = await prisma.coupon.findUnique({
    where: { code: data.code.toUpperCase() },
  });
  if (existing) throw new ApiError(409, "Coupon code already exists");

  return prisma.coupon.create({
    data: { ...data, code: data.code.toUpperCase() },
  });
};

// ADMIN — get all coupons
export const getAllCoupons = async () => {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
};

// ADMIN — toggle active/inactive
export const toggleCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");

  return prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
};

// ADMIN — delete coupon
export const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  await prisma.coupon.delete({ where: { id } });
  return { message: "Coupon deleted" };
};

// CUSTOMER — validate + preview discount on cart
export const applyCouponToCart = async (
  userId: string,
  code: string
) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || !coupon.isActive) {
    throw new ApiError(404, "Invalid or expired coupon code");
  }

  // get cart total
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { price: true } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  const cartTotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const discountAmount = (cartTotal * coupon.discountPercent) / 100;
  const finalTotal = cartTotal - discountAmount;

  return {
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    cartTotal: Number(cartTotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
    couponId: coupon.id,
  };
};

// internal — validate coupon at order placement
export const validateCoupon = async (code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || !coupon.isActive) {
    throw new ApiError(400, "Invalid or expired coupon");
  }
  return coupon;
};