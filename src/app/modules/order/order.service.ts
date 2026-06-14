// src/app/modules/order/order.service.ts
import { OrderItemStatus, OrderStatus } from '@prisma/client';
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
import { CacheKeys } from '../../../utils/cacheKeys';
import { invalidateCache } from '../../../utils/cache';

type ShippingAddressInput = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
};

type CartOwner = { userId: string } | { guestId: string };

const cartWhere = (owner: CartOwner) =>
  "userId" in owner ? { userId: owner.userId } : { guestId: owner.guestId };

// ── Place order (authenticated user) ─────────────────────────────────────────
export const placeOrder = async (
  customerId: string,
  shippingAddress: ShippingAddressInput,
  couponCode?: string,
) => {
  return placeOrderBase({ userId: customerId }, shippingAddress, couponCode, {
    customerId,
  });
};

// ── Place order (guest) ──────────────────────────────────────────────────────
export const placeGuestOrder = async (
  guestId: string,
  guestEmail: string,
  guestName: string,
  guestPhone: string,
  shippingAddress: ShippingAddressInput,
  couponCode?: string,
) => {
  return placeOrderBase({ guestId }, shippingAddress, couponCode, {
    guestId,
    guestEmail,
    guestName,
    guestPhone,
  });
};

// ── Internal: common order placement logic ───────────────────────────────────
type OrderOwnerInfo =
  | { customerId: string }
  | { guestId: string; guestEmail: string; guestName: string; guestPhone: string };

const placeOrderBase = async (
  owner: CartOwner,
  shippingAddress: ShippingAddressInput,
  couponCode: string | undefined,
  ownerInfo: OrderOwnerInfo,
) => {
  const cart = await prisma.cart.findUnique({
    where: cartWhere(owner),
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
            },
          },
          variant: true,
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
    const coupon = await validateCoupon(couponCode, subtotal);
    if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    } else {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }
    discount = Number(Math.max(0, discount).toFixed(2));
    couponId = coupon.id;
  }

  const total = subtotal + shippingCost + tax - discount;

  const order = await prisma.$transaction(async (tx) => {
    const orderData: any = {
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
          variant: item.variantId ?? null,
        })),
      },
    };

    if ('customerId' in ownerInfo) {
      orderData.userId = ownerInfo.customerId;
    } else {
      orderData.guestId = ownerInfo.guestId;
      orderData.guestEmail = ownerInfo.guestEmail;
      orderData.guestName = ownerInfo.guestName;
      orderData.guestPhone = ownerInfo.guestPhone;
    }

    const newOrder = await tx.order.create({
      data: orderData,
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

    await tx.orderAddress.create({
      data: {
        orderId: newOrder.id,
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state ?? "",
        zipCode: shippingAddress.zipCode ?? "",
        country: shippingAddress.country,
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return newOrder;
  });

  await addStatusHistory(order.id, OrderStatus.PENDING, 'Order placed successfully');

  const customerName = 'customerId' in ownerInfo ? '' : ownerInfo.guestName;
  const customerEmail = 'customerId' in ownerInfo ? '' : ownerInfo.guestEmail;

  if ('customerId' in ownerInfo) {
    // ── Authenticated user notifications ──
    const customer = await prisma.user.findUnique({
      where: { id: ownerInfo.customerId },
      select: { name: true, email: true },
    });

    if (customer) {
      await emailQueue.add('order-confirmed', {
        type: 'ORDER_CONFIRMED',
        to: customer.email,
        customerName: customer.name,
        orderId: order.id,
        totalAmount: Number(total),
        items: cart.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: Number(i.product.price),
        })),
      });

      await notificationQueue.add('order-placed', {
        userId: ownerInfo.customerId,
        title: 'Order Placed',
        message: `Your order #${order.id.slice(-6).toUpperCase()} was placed`,
        type: 'ORDER_PLACED',
      });
    }
  } else {
    // ── Guest email notification ──
    await emailQueue.add('order-confirmed', {
      type: 'ORDER_CONFIRMED',
      to: ownerInfo.guestEmail,
      customerName: ownerInfo.guestName,
      orderId: order.id,
      totalAmount: Number(total),
      items: cart.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
      })),
    });
  }

  // ── Notify vendors (common for both auth and guest) ──
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

// CUSTOMER — get their own orders (supports both userId and guestId)
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
        shipping: true,
        payment: true,
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

// GUEST — get guest orders by email
export const getGuestOrders = async (guestEmail: string, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = { guestEmail };

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
        shipping: true,
        payment: true,
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

// CUSTOMER / GUEST — get single order (own only)
export const getOrderById = async (orderId: string, userId: string, guestId: string | undefined, isAdmin: boolean) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
      shipping: true,
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Allow access for: admin, order owner (userId), or guest who owns the order
  if (!isAdmin) {
    if (order.userId && order.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }
    if (order.guestId && order.guestId !== guestId) {
      throw new ApiError(403, 'Access denied');
    }
  }

  return order;
};

// PUBLIC — track guest order by order number + email (no auth required)
export const trackGuestOrder = async (orderId: string, email: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
      shipping: true,
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Guest orders: verify email matches
  if (order.userId) {
    // This is not a guest order
    throw new ApiError(400, 'This order belongs to a registered user. Please sign in to view it.');
  }

  if (order.guestEmail?.toLowerCase() !== email.toLowerCase()) {
    throw new ApiError(403, 'Email does not match this order');
  }

  return order;
};

// ADMIN — update order status
export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: orderId },
      data: { status },
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

    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: status as OrderItemStatus },
    });

    return result;
  });

  await addStatusHistory(orderId, status, `Order status updated to ${status}`);

  return updated;
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
  if (!store) return []; // Return empty array instead of throwing 404

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
    data: status === 'DELIVERED' ? { status, deliveredAt: new Date() } : { status },
  });
    await invalidateCache(CacheKeys.VENDOR_ANALYTICS(store.id));

  const orderWithUser = await prisma.order.findUnique({
    where: { id: item.orderId },
    include: {
      user: { select: { id: true, name: true, email: true } }, // was: customer
    },
  });

  if (orderWithUser?.user) {
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
        user: { select: { id: true, name: true, email: true, phone: true } }, // was: customer
        items: {
          include: {
            store: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
        shipping: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
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

// ADMIN — cancel any order (soft state change, preserves history)
export const adminCancelOrder = async (orderId: string, reason?: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Order is already cancelled');
  }
  if (order.status === 'DELIVERED') {
    throw new ApiError(400, 'Cannot cancel a delivered order');
  }

  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const cancelNote = reason ? `Cancelled by admin — ${reason}` : 'Cancelled by admin';

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: 'CANCELLED' },
    });

    // Restore stock for each item
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await addStatusHistory(orderId, OrderStatus.CANCELLED, cancelNote);
  });

  return { message: 'Order cancelled successfully' };
};