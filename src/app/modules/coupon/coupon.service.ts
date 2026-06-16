// src/app/modules/coupon/coupon.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import { DiscountType } from "@prisma/client";

type CreateCouponInput = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
};

type UpdateCouponInput = Partial<CreateCouponInput>;

// ── Helper: compute discount amount ───────────────────────────────────────────
const computeDiscount = (
  cartTotal: number,
  coupon: { discountType: DiscountType; discountValue: number; maxDiscount?: number | null }
): number => {
  let amount: number;
  if (coupon.discountType === "PERCENTAGE") {
    amount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) {
      amount = Math.min(amount, coupon.maxDiscount);
    }
  } else {
    amount = coupon.discountValue;
  }
  return Number(amount.toFixed(2));
};

// ── Helper: validate coupon rules ─────────────────────────────────────────────
const validateCouponRules = async (
  coupon: {
    id: string;
    isActive: boolean;
    startDate: Date | null;
    expiryDate: Date | null;
    usageLimit: number | null;
    usedCount: number;
  },
  cartTotal?: number
) => {
  if (!coupon.isActive) {
    throw new ApiError(400, "This coupon is no longer active");
  }

  const now = new Date();

  if (coupon.startDate && new Date(coupon.startDate) > now) {
    throw new ApiError(400, "This coupon is not yet available");
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon has reached its usage limit");
  }

  if (cartTotal !== undefined) {
    // Will be validated against the coupon's minOrderAmount in calling function
  }
};

// ADMIN — create coupon
export const createCoupon = async (data: CreateCouponInput) => {
  const existing = await prisma.coupon.findUnique({
    where: { code: data.code.toUpperCase() },
  });
  if (existing) throw new ApiError(409, "Coupon code already exists");

  const discountPercent =
    data.discountType === "PERCENTAGE" ? data.discountValue : 0;

  return prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountPercent,
      minOrderAmount: data.minOrderAmount ?? null,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      isActive: data.isActive ?? true,
    },
  });
};

// ADMIN — get all coupons
export const getAllCoupons = async () => {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
};

// PUBLIC — get active promotional coupons for display (top bar, banners, etc.)
export const getPromotionalCoupons = async () => {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
};

// ADMIN — update coupon
export const updateCoupon = async (id: string, data: UpdateCouponInput) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found");

  const updateData: Record<string, unknown> = {};

  if (data.code !== undefined) {
    const duplicate = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(409, "Coupon code already exists");
    }
    updateData.code = data.code.toUpperCase();
  }

  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) {
    updateData.discountValue = data.discountValue;
    const effectiveType = data.discountType ?? existing.discountType;
    updateData.discountPercent = effectiveType === "PERCENTAGE" ? data.discountValue : 0;
  }
  if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.coupon.update({
    where: { id },
    data: updateData,
  });
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

// ADMIN — delete coupon (only if not used)
export const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { orders: { take: 1 } },
  });
  if (!coupon) throw new ApiError(404, "Coupon not found");

  // Prevent deletion if coupon has been used in orders — preserve order integrity
  if (coupon.orders.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete coupon that has been used in orders. Deactivate it instead."
    );
  }

  await prisma.coupon.delete({ where: { id } });
  return { message: "Coupon deleted successfully" };
};

// CUSTOMER — validate + preview discount on cart
export const applyCouponToCart = async (userId: string, code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) {
    throw new ApiError(404, "Invalid coupon code");
  }

  await validateCouponRules(coupon);

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

  // Check minimum order amount
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} is required for this coupon`
    );
  }

  const discountAmount = computeDiscount(cartTotal, coupon);
  const discountPercent = coupon.discountType === "PERCENTAGE" ? coupon.discountValue : 0;
  const finalTotal = cartTotal - discountAmount;

  return {
    code: coupon.code,
    discountPercent,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    cartTotal: Number(cartTotal.toFixed(2)),
    discountAmount,
    finalTotal: Number(Math.max(0, finalTotal).toFixed(2)),
    couponId: coupon.id,
  };
};

// internal — validate coupon at order placement (with cartTotal for min order check)
export const validateCoupon = async (
  code: string,
  cartTotal?: number,
  owner?: { userId: string } | { guestId: string }
) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) {
    throw new ApiError(400, "Invalid coupon code");
  }

  await validateCouponRules(coupon, cartTotal);

  if (coupon.minOrderAmount && cartTotal !== undefined && cartTotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} is required for this coupon`
    );
  }

  // Per-user coupon usage check — prevent a single user from reusing a coupon
  if (owner) {
    const existingUsage = "userId" in owner
      ? await prisma.order.findFirst({
          where: {
            userId: owner.userId,
            couponId: coupon.id,
            status: { notIn: ["CANCELLED"] },
          },
        })
      : await prisma.order.findFirst({
          where: {
            guestId: owner.guestId,
            couponId: coupon.id,
            status: { notIn: ["CANCELLED"] },
          },
        });

    if (existingUsage) {
      throw new ApiError(400, "This coupon code has already been used on another order");
    }
  }

  // Return discountPercent for backward compatibility with order service
  const discountPercent = coupon.discountType === "PERCENTAGE" ? coupon.discountValue : 0;

  return {
    ...coupon,
    discountPercent,
  };
};