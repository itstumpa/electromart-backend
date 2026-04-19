// src/app/modules/order-tracking/orderTracking.service.ts
import { OrderStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

// called internally whenever order status changes
export const addStatusHistory = async (
  orderId: string,
  status: OrderStatus,
  note?: string
) => {
  return prisma.orderStatusHistory.create({
    data: { orderId, status, note },
  });
};

// GET full timeline for an order
export const getOrderTimeline = async (
  orderId: string,
  requesterId: string,
  isAdmin: boolean
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      items: {
        include: {
          product: { select: { id: true, name: true, images: { take: 1 } } },
          store: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (!isAdmin && order.customerId !== requesterId) {
    throw new ApiError(403, "Access denied");
  }

  return {
    orderId: order.id,
    currentStatus: order.status,
    timeline: order.statusHistory,
    items: order.items,
  };
};