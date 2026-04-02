// src/app/modules/order/order.service.ts
import { OrderStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

export const placeOrder = async (customerId: string) => {
  // get cart from DB
  const cart = await prisma.cart.findUnique({
    where: { userId: customerId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // validate stock for all items first
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new ApiError(400, `"${item.product.name}" is no longer available`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Only ${item.product.stock} units of "${item.product.name}" left in stock`,
      );
    }
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  // create order with items
  const order = await prisma.order.create({
    data: {
      customerId,
      totalAmount,
      status: "PENDING",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          storeId: item.product.storeId,
          quantity: item.quantity,
          priceAtTime: item.product.price,
          status: "PENDING",
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // reduce stock for each product
  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
};

// CUSTOMER — get their own orders
export const getMyOrders = async (customerId: string) => {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// CUSTOMER — get single order (own only)
export const getOrderById = async (
  orderId: string,
  customerId: string,
  isAdmin: boolean,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");

  // customer can only see their own orders
  if (!isAdmin && order.customerId !== customerId) {
    throw new ApiError(403, "Access denied");
  }

  return order;
};

// CUSTOMER — cancel order (only if PENDING)
export const cancelOrder = async (orderId: string, customerId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.customerId !== customerId) throw new ApiError(403, "Access denied");

  if (order.status !== "PENDING") {
    throw new ApiError(400, `Cannot cancel — order is already ${order.status}`);
  }

  // restore stock when cancelled
  const items = await prisma.orderItem.findMany({ where: { orderId } });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: "CANCELLED" },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  return { message: "Order cancelled successfully" };
};

// VENDOR — get orders containing their store items
export const getVendorOrders = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "Store not found");

  return prisma.orderItem.findMany({
    where: { storeId: store.id },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      },
      product: { select: { id: true, name: true, images: { take: 1 } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// VENDOR — update their own order item status
export const updateOrderItemStatus = async (
  orderItemId: string,
  ownerId: string,
  status: OrderStatus,
) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "Store not found");

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
  });
  if (!item) throw new ApiError(404, "Order item not found");

  // make sure this item belongs to vendor's store
  if (item.storeId !== store.id) {
    throw new ApiError(403, "This order item doesn't belong to your store");
  }

  if (item.status === "CANCELLED") {
    throw new ApiError(400, "Cannot update a cancelled order item");
  }

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status },
  });

  // if all items in order are DELIVERED, mark whole order as DELIVERED
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: item.orderId },
  });
  const allDelivered = allItems.every((i) => i.status === "DELIVERED");

  if (allDelivered) {
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: "DELIVERED" },
    });
  }

  return updated;
};

// ADMIN — get all orders
export const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          store: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
