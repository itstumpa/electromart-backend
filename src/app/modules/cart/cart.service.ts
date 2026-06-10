// src/app/modules/cart/cart.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import { formatCartItemResponse } from "./formatter/formatter.viewCart";

// ── Helper: get or create cart for user ──────────────────────────────────────
const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
};

// ── Helper: get full cart with items ─────────────────────────────────────────
const getFullCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              images: { take: 1 },
              store: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) return { items: [], total: 0, itemCount: 0 };

  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return {
    id: cart.id,
    items: cart.items,
    total: Number(total.toFixed(2)),
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// ── Helper: build coupon summary for a cart ───────────────────────────────────
// Always re-fetches the coupon from the DB so stale/deactivated coupons
// are detected immediately without needing the frontend to do anything.
const buildCouponSummary = async (
  couponId: string | null,
  cartTotal: number
): Promise<{
  couponId: string | null;
  couponCode: string | null;
  discountPercent: number;
  discountAmount: number;
}> => {
  if (!couponId) {
    return { couponId: null, couponCode: null, discountPercent: 0, discountAmount: 0 };
  }

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });

  // Coupon deleted or deactivated — clear it from the cart silently
  if (!coupon || !coupon.isActive) {
    await prisma.cart.updateMany({
      where: { couponId },
      data: { couponId: null },
    });
    return { couponId: null, couponCode: null, discountPercent: 0, discountAmount: 0 };
  }

  const discountAmount = Number(
    ((cartTotal * coupon.discountPercent) / 100).toFixed(2)
  );

  return {
    couponId: coupon.id,
    couponCode: coupon.code,
    discountPercent: coupon.discountPercent,
    discountAmount,
  };
};

// ── VIEW cart ─────────────────────────────────────────────────────────────────
export const viewCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              store: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      cartTotal: 0,
      couponId: null,
      couponCode: null,
      discountPercent: 0,
      discountAmount: 0,
      finalTotal: 0,
    };
  }

  const cartTotal = Number(
    cart.items
      .reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
      .toFixed(2)
  );

  const couponSummary = await buildCouponSummary(cart.couponId, cartTotal);

  return {
    items: cart.items.map(formatCartItemResponse),
    cartTotal,
    couponId: couponSummary.couponId,
    couponCode: couponSummary.couponCode,
    discountPercent: couponSummary.discountPercent,
    discountAmount: couponSummary.discountAmount,
    finalTotal: Number((cartTotal - couponSummary.discountAmount).toFixed(2)),
  };
};

// ── APPLY coupon to cart ──────────────────────────────────────────────────────
// Validates the coupon, then persists couponId on the Cart row.
// Discount amounts are NOT stored — they are always recomputed on retrieval.
export const applyCartCoupon = async (userId: string, code: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw new ApiError(404, "Invalid or expired coupon code");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: { select: { price: true } } } },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // Persist the coupon reference on the cart
  await prisma.cart.update({
    where: { userId },
    data: { couponId: coupon.id },
  });

  // Return the updated cart view (recomputes everything from live data)
  return viewCart(userId);
};

// ── REMOVE coupon from cart ───────────────────────────────────────────────────
export const removeCartCoupon = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");

  await prisma.cart.update({
    where: { userId },
    data: { couponId: null },
  });

  return viewCart(userId);
};

// ── ADD item ──────────────────────────────────────────────────────────────────
export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const cart = await getOrCreateCart(userId);

  const normalizedVariantId = variantId ?? null;

  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: normalizedVariantId,
    },
  });

  const existingQty = existing?.quantity ?? 0;

  const totalQty = existingQty + quantity;

  if (product.stock < totalQty) {
    throw new ApiError(
      400,
      `Not enough stock. Available: ${product.stock - existingQty}`
    );
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: totalQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        variantId: normalizedVariantId,
      },
    });
  }

  return getFullCart(userId);
};
// ── UPDATE quantity ───────────────────────────────────────────────────────────
export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number,
  variantId: string,
) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");
  const normalizedVariantId = variantId ?? null;
  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: normalizedVariantId }
  });
  if (!item) throw new ApiError(404, "Item not in cart");

  // validate stock
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} items in stock`);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return getFullCart(userId);
};

// ── REMOVE single item ────────────────────────────────────────────────────────
export const removeFromCart = async (userId: string, productId: string, variantId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");
  const normalizedVariantId = variantId ?? null;
  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: normalizedVariantId }
  });

  if (!item) throw new ApiError(404, "Item not in cart");

  await prisma.cartItem.delete({ where: { id: item.id } });

  return getFullCart(userId);
};

// ── CLEAR cart ────────────────────────────────────────────────────────────────
export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return { message: "Cart already empty" };

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { message: "Cart cleared" };
};

// ── MERGE guest cart into DB cart ─────────────────────────────────────────────
export const mergeCart = async (
  userId: string,
  guestItems: { productId: string; quantity: number; variantId: string }[]
) => {
  const cart = await getOrCreateCart(userId);

  for (const guestItem of guestItems) {
    // silently skip invalid products during merge
    const product = await prisma.product.findUnique({
      where: { id: guestItem.productId, isActive: true },
    });
    if (!product) continue;
    const normalizedVariantId = guestItem.variantId ?? null;
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: guestItem.productId, variantId: normalizedVariantId }
    });

    if (existing) {
      // add quantities but cap at stock
      const newQty = Math.min(
        existing.quantity + guestItem.quantity,
        product.stock
      );
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      const quantity = Math.min(guestItem.quantity, product.stock);
      if (quantity > 0) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: guestItem.productId,
            quantity,
            variantId: normalizedVariantId,
          },
        });
      }
    }
  }

  return getFullCart(userId);
};