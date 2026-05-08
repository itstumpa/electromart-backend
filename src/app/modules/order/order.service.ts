// src/app/modules/order/order.service.ts
import { OrderStatus } from '@prisma/client';
import { emailQueue } from '../../../jobs/queues/email.queue';
import { notificationQueue } from '../../../jobs/queues/notification.queue';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { newOrderVendorEmail, orderConfirmedEmail, orderStatusUpdateEmail } from '../../../utils/emailTemplates';
import { paginationHelper, type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { sendEmail } from '../../../utils/sendEmail';
import { validateCoupon } from '../coupon/coupon.service';
import { createNotification } from '../notification/notification.service';
import { addStatusHistory } from '../order-tracking/orderTracking.service';

export const placeOrder = async (customerId: string, couponCode?: string) => {
const cart = await prisma.cart.findUnique({
  where: { userId: customerId },
  include: {
    items: {
      include: {
        product: {
          include: {
            images: { take: 1 }, // ← add this
          },
        },
        variant: true, // ← add this if you need variant details
      },
    },
  },
});

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new ApiError(400, `"${item.product.name}" is no longer available`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Only ${item.product.stock} units of "${item.product.name}" left in stock`);
    }
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const shippingCost = 0;
  const tax = 0;

  let discount = 0;
  let couponId: string | undefined;

  if (couponCode) {
    const coupon = await validateCoupon(couponCode);
    discount = (subtotal * coupon.discountPercent) / 100;
    couponId = coupon.id;
  }

  const total = subtotal + shippingCost + tax - discount;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: customerId,
        subtotal,
        shippingCost,
        tax,
        total,
        discount,
        couponId: couponId ?? null,
items: {
  create: cart.items.map((item) => ({
    productId: item.productId,
    storeId: item.product.storeId,
    quantity: item.quantity,
    priceAtTime: item.product.price,
    productImage: item.product.images[0]?.url ?? '',
    variant: item.variantId ?? null, // just the ID string, or a label if you prefer
  })),
},
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            store: { select: { id: true, name: true } },
          },
        },
      },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    
    return newOrder;
  });


await addStatusHistory(order.id, OrderStatus.PENDING, 'Order placed successfully');

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { name: true, email: true },
  });

  // notify customer — email queue only (pick one path)
  await emailQueue.add('order-confirmed', {
    type: 'ORDER_CONFIRMED',
    to: customer!.email,
    customerName: customer!.name,
    orderId: order.id,
    totalAmount: Number(total),
    items: cart.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: Number(i.product.price),
    })),
  });

  await notificationQueue.add('order-placed', {
    userId: customerId,
    title: 'Order Placed',
    message: `Your order #${order.id.slice(-6).toUpperCase()} was placed`,
    type: 'ORDER_PLACED',
  });

  // notify each unique vendor
  const vendorMap = new Map<
    string,
    {
      ownerId: string;
      name: string;
      email: string;
      storeName: string;
      items: { name: string; quantity: number }[];
    }
  >();

  for (const item of cart.items) {
    const store = await prisma.store.findUnique({
      where: { id: item.product.storeId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!store) continue;

    if (!vendorMap.has(store.id)) {
      vendorMap.set(store.id, {
        ownerId: store.owner.id,
        name: store.owner.name,
        email: store.owner.email,
        storeName: store.name,
        items: [],
      });
    }
    vendorMap.get(store.id)!.items.push({
      name: item.product.name,
      quantity: item.quantity,
    });
  }

  for (const vendor of vendorMap.values()) {
    await notificationQueue.add('new-order-vendor', {
      userId: vendor.ownerId,
      title: 'New Order Received',
      message: `You have a new order with ${vendor.items.length} item(s) in ${vendor.storeName}`,
      type: 'NEW_ORDER_VENDOR',
    });

    await emailQueue.add('new-order-vendor', {
      type: 'NEW_ORDER_VENDOR',
      to: vendor.email,
      vendorName: vendor.name,
      storeName: vendor.storeName,
      orderId: order.id,
      items: vendor.items,
    });
  }

  return order;
};

// CUSTOMER — get their own orders
export const getMyOrders = async (userId: string, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = { userId };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { take: 1 } } },
            store: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// CUSTOMER — get single order (own only)
export const getOrderById = async (orderId: string, userId: string, isAdmin: boolean) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  if (!isAdmin && order.userId !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  return order;
};

// CUSTOMER — cancel order (only if PENDING)
export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.userId !== userId) throw new ApiError(403, 'Access denied');

  if (order.status !== 'PENDING') {
    throw new ApiError(400, `Cannot cancel — order is already ${order.status}`);
  }

  const items = await prisma.orderItem.findMany({ where: { orderId } });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: 'CANCELLED' },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await addStatusHistory(orderId, OrderStatus.CANCELLED, 'Cancelled by customer');
  });

  return { message: 'Order cancelled successfully' };
};

// VENDOR — get orders containing their store items
export const getVendorOrders = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, 'Store not found');

  return prisma.orderItem.findMany({
    where: { storeId: store.id },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          total: true,        // was: totalAmount — field is `total` in schema
          createdAt: true,
          user: { select: { id: true, name: true, email: true } }, // was: customer
        },
      },
      product: { select: { id: true, name: true, images: { take: 1 } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateOrderItemStatus = async (
  orderItemId: string,
  ownerId: string,
  status: OrderStatus
) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, 'Store not found');

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new ApiError(404, 'Order item not found');

  if (item.storeId !== store.id) {
    throw new ApiError(403, "This order item doesn't belong to your store");
  }

  if (item.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot update a cancelled order item');
  }

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status },
  });

  const orderWithUser = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: {
      user: { select: { id: true, name: true, email: true } }, // was: customer
    },
  });

  if (orderWithUser) {
    await createNotification({
      userId: orderWithUser.user.id,
      title: 'Order Status Updated',
      message: `Your order item status changed to ${status}`,
      type: 'ORDER_STATUS_CHANGED',
    });

    const statusEmail = orderStatusUpdateEmail(orderWithUser.user.name, item.orderId, status);
    await sendEmail({ to: orderWithUser.user.email, ...statusEmail });
  }

  await addStatusHistory(
    item.orderId,
    status,
    `Item "${item.productId}" marked as ${status} by vendor`
  );

  const allItems = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
  const allDelivered = allItems.every((orderItem) => orderItem.status === 'DELIVERED');

  if (allDelivered) {
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: 'DELIVERED' },
    });

    await addStatusHistory(item.orderId, OrderStatus.DELIVERED, 'All items delivered');
  }

  return updated;
};

// ADMIN — get all orders
export const getAllOrders = async (
  query: { status?: string; search?: string },
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = {
    ...(query.status && { status: query.status as OrderStatus }),
    ...(query.search && {
      user: {                          // was: customer
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } }, // was: customer
        items: {
          include: {
            store: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};