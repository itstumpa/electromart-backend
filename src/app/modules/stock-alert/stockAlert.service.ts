// src/app/modules/stock-alert/stockAlert.service.ts
import { prisma } from "../../../lib/prisma";
import { createNotification } from "../notification/notification.service";
import { sendEmail } from "../../../utils/sendEmail";
import ApiError from "../../../utils/apiErrors";

// CUSTOMER — subscribe to stock alert
export const subscribeToStockAlert = async (
  userId: string,
  productId: string
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");
  if (product.stock > 0) throw new ApiError(400, "Product is already in stock");

  const existing = await prisma.stockAlert.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new ApiError(409, "Already subscribed to this alert");

  return prisma.stockAlert.create({
    data: { userId, productId },
  });
};

// CUSTOMER — unsubscribe
export const unsubscribeFromStockAlert = async (
  userId: string,
  productId: string
) => {
  const alert = await prisma.stockAlert.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!alert) throw new ApiError(404, "Alert not found");

  await prisma.stockAlert.delete({
    where: { userId_productId: { userId, productId } },
  });
  return { message: "Unsubscribed from stock alert" };
};

// CUSTOMER — get own alerts
export const getMyStockAlerts = async (userId: string) => {
  return prisma.stockAlert.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true, name: true, price: true, stock: true,
          images: { take: 1 },
        },
      },
    },
  });
};

// called internally when vendor updates product stock
export const notifyStockAlert = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.stock <= 0) return;

  const alerts = await prisma.stockAlert.findMany({
    where: { productId, notified: false },
    include: { user: true },
  });

  if (alerts.length === 0) return;

  // notify all subscribed users
  await Promise.all(
    alerts.map(async (alert) => {
      await createNotification({
        userId: alert.userId,
        title: "Back In Stock!",
        message: `"${product.name}" is back in stock. Order now!`,
        type: "STOCK_ALERT",
      });

      await sendEmail({
        to: alert.user.email,
        subject: `✅ "${product.name}" is Back In Stock — ElectroMart`,
        html: `
          <p>Hi ${alert.user.name},</p>
          <p>Great news! <strong>${product.name}</strong> is back in stock.</p>
          <p>Price: <strong>$${product.price}</strong></p>
          <p>Don't miss out — order now before it sells out again!</p>
        `,
      });

      // mark as notified
      await prisma.stockAlert.update({
        where: { userId_productId: { userId: alert.userId, productId } },
        data: { notified: true },
      });
    })
  );
};