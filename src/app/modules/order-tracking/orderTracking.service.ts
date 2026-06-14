// src/app/modules/order-tracking/orderTracking.service.ts
import { OrderStatus } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';

// called internally whenever order status changes
export const addStatusHistory = async (orderId: string, status: OrderStatus, note?: string) => {
  return prisma.orderStatusHistory.create({
    data: { orderId, status, note },
  });
};

// GET full timeline for an order
export const getOrderTimeline = async (orderId: string, requesterId: string, role: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      statusHistory: { orderBy: { createdAt: 'asc' } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, ownerId: true, name: true } },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Allow: ADMIN / SUPER_ADMIN, the order's customer, or a VENDOR who owns items in the order
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isCustomer = order.userId === requesterId;
  const isVendorWithItems = role === 'VENDOR' && order.items.some((item) => item.store?.ownerId === requesterId);

  if (!isAdmin && !isCustomer && !isVendorWithItems) {
    throw new ApiError(403, 'Access denied');
  }

  return {
    orderId: order.id,
    currentStatus: order.status,
    timeline: order.statusHistory,
    items: order.items,
  };
};

// PUBLIC — guest order timeline (requires email verification)
export const getGuestOrderTimeline = async (orderId: string, email: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      statusHistory: { orderBy: { createdAt: 'asc' } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');

  // Guest orders must have no userId and email must match
  if (order.userId) {
    throw new ApiError(400, 'This order belongs to a registered user. Please sign in to view tracking.');
  }

  if (order.guestEmail?.toLowerCase() !== email.toLowerCase()) {
    throw new ApiError(403, 'Email does not match this order');
  }

  return {
    orderId: order.id,
    currentStatus: order.status,
    timeline: order.statusHistory,
    items: order.items,
  };
};
