// src/app/modules/return/return.service.ts
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { createNotification } from '../notification/notification.service';
import { sendEmail } from '../../../utils/sendEmail';
import { returnRequestedEmail } from '../../../utils/emailTemplates';

// CUSTOMER — request return on a delivered order item
export const createReturnRequest = async (customerId: string, orderItemId: string, reason: string) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      product: true,
      store: { include: { owner: true } },
    },
  });

  if (!orderItem) throw new ApiError(404, 'Order item not found');
  if (orderItem.order.userId !== customerId) {
    throw new ApiError(403, 'This is not your order');
  }
  if (orderItem.status !== 'DELIVERED') {
    throw new ApiError(400, 'You can only return delivered items');
  }

  // check not already requested
  const existing = await prisma.returnRequest.findUnique({
    where: { orderItemId },
  });
  if (existing) throw new ApiError(409, 'Return already requested for this item');

  const returnRequest = await prisma.returnRequest.create({
    data: { orderItemId, customerId, reason },
  });

  // notify vendor — in-app + email
  await createNotification({
    userId: orderItem.store.ownerId,
    title: 'Return Requested',
    message: `A customer requested a return for "${orderItem.product.name}"`,
    type: 'RETURN_REQUESTED',
  });

  const emailData = returnRequestedEmail(orderItem.store.owner.name, orderItem.product.name, reason);
  await sendEmail({ to: orderItem.store.owner.email, ...emailData });

  return returnRequest;
};

// VENDOR — get return requests for their store
export const getVendorReturnRequests = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, 'Store not found');

  return prisma.returnRequest.findMany({
    where: { orderItem: { storeId: store.id } },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      orderItem: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// VENDOR — approve or reject
export const resolveReturnRequest = async (
  returnId: string,
  ownerId: string,
  status: 'APPROVED' | 'REJECTED',
  vendorNote?: string
) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      orderItem: {
        include: { store: true, product: true },
      },
      customer: true,
    },
  });

  if (!returnRequest) throw new ApiError(404, 'Return request not found');
  if (returnRequest.orderItem.store.ownerId !== ownerId) {
    throw new ApiError(403, 'This return request is not for your store');
  }
  if (returnRequest.status !== 'PENDING') {
    throw new ApiError(400, 'This request has already been resolved');
  }

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status, vendorNote },
  });

  // notify customer
  await createNotification({
    userId: returnRequest.customerId,
    title: `Return ${status}`,
    message: `Your return request for "${returnRequest.orderItem.product.name}" was ${status.toLowerCase()}`,
    type: 'RETURN_RESOLVED',
  });

  await sendEmail({
    to: returnRequest.customer.email,
    subject: `Return Request ${status} — ElectroMart`,
    html: `
      <p>Hi ${returnRequest.customer.name},</p>
      <p>Your return request for <strong>${returnRequest.orderItem.product.name}</strong> has been <strong>${status}</strong>.</p>
      ${vendorNote ? `<p>Vendor note: <em>${vendorNote}</em></p>` : ''}
    `,
  });

  return updated;
};

// CUSTOMER — view own return requests
export const getMyReturnRequests = async (customerId: string) => {
  return prisma.returnRequest.findMany({
    where: { customerId },
    include: {
      orderItem: {
        include: {
          product: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
