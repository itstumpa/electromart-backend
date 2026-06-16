// src/app/modules/payment/payment.service.ts
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { sendEmail } from '../../../utils/sendEmail';
import config from '../../config';
import { createNotification } from '../notification/notification.service';
import {
  initiateSSLCommerzPayment,
  refundSSLCommerzPayment,
  validateSSLCommerzPayment,
  verifySSLCommerzIPNSignature,
} from './sslcommerz.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ── INITIATE PAYMENT (Authenticated User) ─────────────────────────────────────

export const initiatePayment = async (customerId: string, orderId: string, PaymentGateway: 'SSLCOMMERZ' | 'STRIPE') => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
      payment: true,
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');
  // Allow access for order owner (authenticated)
  if (order.userId && order.userId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }
  if (order.payment?.status === 'PAID') {
    throw new ApiError(400, 'Order already paid');
  }

  return initiatePaymentForOrder(order, PaymentGateway);
};

// ── INITIATE PAYMENT (Guest) ──────────────────────────────────────────────────

export const initiateGuestPayment = async (guestId: string, orderId: string, PaymentGateway: 'SSLCOMMERZ' | 'STRIPE') => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
      payment: true,
    },
  });

  if (!order) throw new ApiError(404, 'Order not found');
  // Allow access for guest order owner
  if (order.guestId && order.guestId !== guestId) {
    throw new ApiError(403, 'Access denied');
  }
  if (order.payment?.status === 'PAID') {
    throw new ApiError(400, 'Order already paid');
  }

  return initiatePaymentForOrder(order, PaymentGateway);
};

// ── SHARED: INITIATE PAYMENT FOR ORDER ────────────────────────────────────────

const initiatePaymentForOrder = async (
  order: {
    id: string;
    userId: string | null;
    guestId: string | null;
    guestName: string | null;
    guestEmail: string | null;
    total: number | Prisma.Decimal;
    items: Array<{
      product: { name: string; price: number | Prisma.Decimal };
      quantity: number;
    }>;
    payment: { status: string } | null;
    user?: { name: string | null; email: string | null } | null;
  },
  PaymentGateway: 'SSLCOMMERZ' | 'STRIPE'
) => {
  const amount = Number(order.total);

  // ── SSLCommerz ──────────────────────────────────────────────────────────────
  if (PaymentGateway === 'SSLCOMMERZ') {
    const { gatewayUrl, sessionKey } = await initiateSSLCommerzPayment({
      orderId: order.id,
      amount,
      currency: 'BDT',
      customerName: order.guestName ?? order.user?.name ?? 'Customer',
      customerEmail: order.guestEmail ?? order.user?.email ?? 'guest@example.com',
      customerPhone: '01700000000',
      customerAddress: 'Dhaka, Bangladesh',
    });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        gateway: 'SSLCOMMERZ',
        status: 'PENDING',
        sessionId: sessionKey,
        amount,
        currency: 'BDT',
      },
      create: {
        orderId: order.id,
        gateway: 'SSLCOMMERZ',
        status: 'PENDING',
        sessionId: sessionKey,
        amount,
        currency: 'BDT',
      },
    });

    return { gateway: 'SSLCOMMERZ', gatewayUrl };
  }

  // ── Stripe ──────────────────────────────────────────────────────────────────
  if (PaymentGateway === 'STRIPE') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.product.name },
          unit_amount: Math.round(Number(item.product.price) * 100),
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: order.id },
      success_url: `${config.frontend_url}/payment/result?status=success&orderId=${order.id}`,
      cancel_url: `${config.frontend_url}/payment/result?status=cancel&orderId=${order.id}`,
    });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        gateway: 'STRIPE',
        status: 'PENDING',
        sessionId: session.id,
        amount,
        currency: 'USD',
      },
      create: {
        orderId: order.id,
        gateway: 'STRIPE',
        status: 'PENDING',
        sessionId: session.id,
        amount,
        currency: 'USD',
      },
    });

    return { gateway: 'STRIPE', gatewayUrl: session.url };
  }

  throw new ApiError(400, 'Invalid payment gateway');
};

// ── SSLCOMMERZ SUCCESS REDIRECT ───────────────────────────────────────────────

export const handleSSLCommerzSuccess = async (body: Record<string, string>) => {
  const { val_id, tran_id, status } = body;

  if (status !== 'VALID' && status !== 'VALIDATED') {
    throw new ApiError(400, 'Payment validation failed');
  }

  const validation = await validateSSLCommerzPayment(val_id);

  if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
    await prisma.payment.update({
      where: { orderId: tran_id },
      data: { status: 'FAILED', gatewayResponse: JSON.stringify(validation) },
    });
    throw new ApiError(400, 'Payment validation failed on server');
  }

  await confirmPayment(tran_id, validation.bank_tran_id, validation);
  return { orderId: tran_id };
};

// ── SSLCOMMERZ FAIL REDIRECT ──────────────────────────────────────────────────

export const handleSSLCommerzFail = async (body: Record<string, string>) => {
  const { tran_id } = body;

  await prisma.payment.update({
    where: { orderId: tran_id },
    data: { status: 'FAILED', gatewayResponse: body },
  });

  await prisma.order.update({
    where: { id: tran_id },
    data: { status: 'CANCELLED' },
  });

  return { orderId: tran_id };
};

// ── SSLCOMMERZ IPN (server-to-server webhook) ─────────────────────────────────

export const handleSSLCommerzIPN = async (body: Record<string, string>) => {
  // Verify SSLCommerz IPN signature to authenticate the request
  if (!verifySSLCommerzIPNSignature(body)) {
    console.error('SSLCommerz IPN signature verification failed');
    return;
  }

  const { val_id, tran_id, status } = body;

  if (status === 'VALID' || status === 'VALIDATED') {
    const validation = await validateSSLCommerzPayment(val_id);
    if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
      await confirmPayment(tran_id, validation.bank_tran_id, validation);
    }
  } else if (status === 'FAILED') {
    await prisma.payment.updateMany({
      where: { orderId: tran_id },
      data: { status: 'FAILED' },
    });
  }
};

// ── STRIPE WEBHOOK ────────────────────────────────────────────────────────────

export const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch {
    throw new ApiError(400, 'Invalid Stripe webhook signature');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return;
    await confirmPayment(orderId, session.payment_intent as string, JSON.parse(JSON.stringify(session)));
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    await prisma.payment.update({
      where: { orderId },
      data: { status: 'FAILED', gatewayResponse: JSON.stringify(session) },
    });
  }
};

// ── SHARED: CONFIRM PAYMENT ───────────────────────────────────────────────────

const confirmPayment = async (orderId: string, transactionId: string, gatewayResponse: Record<string, unknown>) => {
  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing?.status === 'PAID') return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: 'PAID', transactionId, gatewayResponse: JSON.stringify(gatewayResponse) },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true }, // was: customer
  });

  if (order) {
    if (order.userId) {
      await createNotification({
        userId: order.userId, // was: order.customerId
        title: 'Payment Successful',
        message: `Payment confirmed for order #${orderId.slice(-6).toUpperCase()}`,
        type: 'ORDER_PLACED',
      });
    }

    const recipientEmail = order.user?.email ?? order.guestEmail;
    const recipientName = order.user?.name ?? order.guestName ?? 'Customer';
    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: '✅ Payment Confirmed — Electromart',
        html: `
          <p>Hi ${recipientName},</p>
          <p>Your payment of <strong>$${Number(order.total)}</strong> for order 
          <strong>#${orderId.slice(-6).toUpperCase()}</strong> was successful.</p>
          <p>Transaction ID: <code>${transactionId}</code></p>
          <p>Your order is now being processed.</p>
        `,
      });
    }
  }
};

// ── REFUND ────────────────────────────────────────────────────────────────────

export const refundPayment = async (orderId: string, reason: string) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: { include: { user: true } } }, // was: customer
  });

  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== 'PAID') {
    throw new ApiError(400, 'Only successful payments can be refunded');
  }
  if (!payment.transactionId) {
    throw new ApiError(400, 'No transaction ID found for this payment');
  }

  let refundId: string;

  if (payment.gatewayResponse === 'SSLCOMMERZ') {
    const result = await refundSSLCommerzPayment(payment.transactionId, Number(payment.amount), reason);

    if (result.status !== 'paid') {
      throw new ApiError(400, `SSLCommerz refund failed: ${result.errorReason}`);
    }

    refundId = result.refund_ref_id;
  } else if (payment.gatewayResponse === 'STRIPE') {
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      reason: 'requested_by_customer',
    });
    refundId = refund.id;
  } else {
    throw new ApiError(400, 'Unknown gateway');
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: 'REFUNDED', refundId },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  });

  if (payment.order.userId) {
    await createNotification({
      userId: payment.order.userId, // was: order.customerId
      title: 'Refund Processed',
      message: `Your refund of ${payment.amount} has been processed`,
      type: 'ORDER_STATUS_CHANGED',
    });
  }

  const refundRecipientEmail = payment.order.user?.email ?? payment.order.guestEmail;
  const refundRecipientName = payment.order.user?.name ?? payment.order.guestName ?? 'Customer';
  if (refundRecipientEmail) {
    await sendEmail({
      to: refundRecipientEmail,
      subject: '💰 Refund Processed — Electromart',
      html: `
        <p>Hi ${refundRecipientName},</p>
        <p>Your refund of <strong>${payment.amount} ${payment.currency}</strong> 
        for order <strong>#${orderId.slice(-6).toUpperCase()}</strong> has been processed.</p>
        <p>Refund ID: <code>${refundId}</code></p>
        <p>It may take 3-7 business days to reflect in your account.</p>
      `,
    });
  }

  return { message: 'Refund processed successfully', refundId };
};

// ── GET PAYMENT STATUS ────────────────────────────────────────────────────────

export const getPaymentByOrderId = async (orderId: string, customerId: string, guestId: string | undefined, isAdmin: boolean) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: { select: { userId: true, guestId: true } } },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');
  if (!isAdmin) {
    if (payment.order.userId && payment.order.userId !== customerId) {
      throw new ApiError(403, 'Access denied');
    }
    if (payment.order.guestId && payment.order.guestId !== guestId) {
      throw new ApiError(403, 'Access denied');
    }
  }

  return payment;
};
