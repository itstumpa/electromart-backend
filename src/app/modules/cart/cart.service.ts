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
          variant: true, // ✅ CORRECT PLACE
        },
      },
    },
  });

  if (!cart) {
    return { items: [] };
  }

  return {
    items: cart.items.map(formatCartItemResponse),
  };
};

// ── ADD item ──────────────────────────────────────────────────────────────────
export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
) => {
  // validate product
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });
  if (!product) throw new ApiError(404, "Product not found");
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} items in stock`);
  }

  const cart = await getOrCreateCart(userId);

  // check if product already in cart
 const normalizedVariantId: string | null = variantId ?? null;

const existing = await prisma.cartItem.findUnique({
  where: {
    cartId_productId_variantId: {
      cartId: cart.id,
      productId,
      variantId: normalizedVariantId as string,
    },
  },
});

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) {
      throw new ApiError(
        400,
        `Cannot add ${quantity} more — only ${product.stock - existing.quantity} left`
      );
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, variantId: normalizedVariantId as string },
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

  const normalizedVariantId: string | null = variantId ?? null;

  const item = await prisma.cartItem.findUnique({
   where: {
    cartId_productId_variantId: {
      cartId: cart.id,
      productId,
      variantId: normalizedVariantId as string,
    },
  },
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
export const removeFromCart = async (userId: string, productId: string, variantId: string,) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");


const normalizedVariantId: string | null = variantId ?? null;

  const item = await prisma.cartItem.findUnique({
     where: {
    cartId_productId_variantId: {
      cartId: cart.id,
      productId,
      variantId: normalizedVariantId as string,
    },
  },
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
  guestItems: { productId: string; quantity: number, variantId: string, }[]
) => {
  const cart = await getOrCreateCart(userId);

  for (const guestItem of guestItems) {
    // silently skip invalid products during merge
    const product = await prisma.product.findUnique({
      where: { id: guestItem.productId, isActive: true },
    });
    if (!product) continue;
const normalizedVariantId: string | null = guestItem.variantId ?? null;

    const existing = await prisma.cartItem.findUnique({
      where: {
    cartId_productId_variantId: {
      cartId: cart.id,
      productId: guestItem.productId,
      variantId: normalizedVariantId,
    },
  },
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
          },
        });
      }
    }
  }

  return getFullCart(userId);
};