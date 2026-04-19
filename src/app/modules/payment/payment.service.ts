// src/app/modules/payment/payment.service.ts
import Stripe from "stripe";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/ApiError";
import {
  initiateSSLCommerzPayment,
  validateSSLCommerzPayment,
  refundSSLCommerzPayment,
} from "./sslcommerz.service";
import { createNotification } from "../notification/notification.service";
import { sendEmail } from "../../../utils/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ── INITIATE PAYMENT ──────────────────────────────────────────────────────────

export const initiatePayment = async (
  customerId: string,
  orderId: string,
  gateway: "SSLCOMMERZ" | "STRIPE"
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: { include: { product: true } },
      payment: true,
    },
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.customerId !== customerId) throw new ApiError(403, "Access denied");
  if (order.payment?.status === "SUCCESS") {
    throw new ApiError(400, "Order already paid");
  }

  const amount = Number(order.totalAmount);

  // ── SSLCommerz ──────────────────────────────────────────────────────────────
  if (gateway === "SSLCOMMERZ") {
    const { gatewayUrl, sessionKey } = await initiateSSLCommerzPayment({
      orderId,
      amount,
      currency: "BDT",
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: "01700000000", // ideally from user profile
      customerAddress: "Dhaka, Bangladesh",
    });

    // upsert payment record
    await prisma.payment.upsert({
      where: { orderId },
      update: {
        gateway: "SSLCOMMERZ",
        status: "PENDING",
        sessionId: sessionKey,
        amount,
        currency: "BDT",
      },
      create: {
        orderId,
        gateway: "SSLCOMMERZ",
        status: "PENDING",
        sessionId: sessionKey,
        amount,
        currency: "BDT",
      },
    });

    return { gateway: "SSLCOMMERZ", gatewayUrl };
  }

  // ── Stripe ──────────────────────────────────────────────────────────────────
  if (gateway === "STRIPE") {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.product.name },
          unit_amount: Math.round(Number(item.product.price) * 100), // cents
        },
        quantity: item.quantity,
      })),
      metadata: { orderId },
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}?orderId=${orderId}`,
    });

    await prisma.payment.upsert({
      where: { orderId },
      update: {
        gateway: "STRIPE",
        status: "PENDING",
        sessionId: session.id,
        amount,
        currency: "USD",
      },
      create: {
        orderId,
        gateway: "STRIPE",
        status: "PENDING",
        sessionId: session.id,
        amount,
        currency: "USD",
      },
    });

    return { gateway: "STRIPE", gatewayUrl: session.url };
  }

  throw new ApiError(400, "Invalid payment gateway");
};

// ── SSLCOMMERZ SUCCESS REDIRECT ───────────────────────────────────────────────

export const handleSSLCommerzSuccess = async (body: any) => {
  const { val_id, tran_id, status } = body;

  if (status !== "VALID" && status !== "VALIDATED") {
    throw new ApiError(400, "Payment validation failed");
  }

  // validate with SSLCommerz server
  const validation = await validateSSLCommerzPayment(val_id);

  if (
    validation.status !== "VALID" &&
    validation.status !== "VALIDATED"
  ) {
    await prisma.payment.update({
      where: { orderId: tran_id },
      data: { status: "FAILED", gatewayResponse: validation },
    });
    throw new ApiError(400, "Payment validation failed on server");
  }

  await confirmPayment(tran_id, validation.bank_tran_id, validation);
  return { orderId: tran_id };
};

// ── SSLCOMMERZ FAIL REDIRECT ──────────────────────────────────────────────────

export const handleSSLCommerzFail = async (body: any) => {
  const { tran_id } = body;

  await prisma.payment.update({
    where: { orderId: tran_id },
    data: { status: "FAILED", gatewayResponse: body },
  });

  await prisma.order.update({
    where: { id: tran_id },
    data: { status: "CANCELLED" },
  });

  return { orderId: tran_id };
};

// ── SSLCOMMERZ IPN (server-to-server webhook) ─────────────────────────────────

export const handleSSLCommerzIPN = async (body: any) => {
  const { val_id, tran_id, status } = body;

  if (status === "VALID" || status === "VALIDATED") {
    const validation = await validateSSLCommerzPayment(val_id);
    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      await confirmPayment(tran_id, validation.bank_tran_id, validation);
    }
  } else if (status === "FAILED") {
    await prisma.payment.updateMany({
      where: { orderId: tran_id },
      data: { status: "FAILED" },
    });
  }
};

// ── STRIPE WEBHOOK ────────────────────────────────────────────────────────────

export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string
) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    throw new ApiError(400, "Invalid Stripe webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) return;

    await confirmPayment(orderId, session.payment_intent as string, session);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    await prisma.payment.update({
      where: { orderId },
      data: { status: "FAILED", gatewayResponse: session as any },
    });
  }
};

// ── SHARED: CONFIRM PAYMENT ───────────────────────────────────────────────────

const confirmPayment = async (
  orderId: string,
  transactionId: string,
  gatewayResponse: any
) => {
  // idempotent — skip if already confirmed
  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing?.status === "SUCCESS") return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: "SUCCESS",
        transactionId,
        gatewayResponse,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });
  });

  // notify customer
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });

  if (order) {
    await createNotification({
      userId: order.customerId,
      title: "Payment Successful",
      message: `Payment confirmed for order #${orderId.slice(-6).toUpperCase()}`,
      type: "ORDER_PLACED",
    });

    await sendEmail({
      to: order.customer.email,
      subject: "✅ Payment Confirmed — ElectroMart",
      html: `
        <p>Hi ${order.customer.name},</p>
        <p>Your payment of <strong>$${Number(order.totalAmount)}</strong> for order 
        <strong>#${orderId.slice(-6).toUpperCase()}</strong> was successful.</p>
        <p>Transaction ID: <code>${transactionId}</code></p>
        <p>Your order is now being processed.</p>
      `,
    });
  }
};

// ── REFUND ────────────────────────────────────────────────────────────────────

export const refundPayment = async (orderId: string, reason: string) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: { include: { customer: true } } },
  });

  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "SUCCESS") {
    throw new ApiError(400, "Only successful payments can be refunded");
  }
  if (!payment.transactionId) {
    throw new ApiError(400, "No transaction ID found for this payment");
  }

  let refundId: string;

  // ── SSLCommerz refund ────────────────────────────────────────────────────
  if (payment.gateway === "SSLCOMMERZ") {
    const result = await refundSSLCommerzPayment(
      payment.transactionId,
      Number(payment.amount),
      reason
    );

    if (result.status !== "success") {
      throw new ApiError(400, `SSLCommerz refund failed: ${result.errorReason}`);
    }

    refundId = result.refund_ref_id;
  }

  // ── Stripe refund ────────────────────────────────────────────────────────
  else if (payment.gateway === "STRIPE") {
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      reason: "requested_by_customer",
    });
    refundId = refund.id;
  } else {
    throw new ApiError(400, "Unknown gateway");
  }

  // update payment + order
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: "REFUNDED", refundId },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });

  // notify customer
  await createNotification({
    userId: payment.order.customerId,
    title: "Refund Processed",
    message: `Your refund of ${payment.amount} has been processed`,
    type: "ORDER_STATUS_CHANGED",
  });

  await sendEmail({
    to: payment.order.customer.email,
    subject: "💰 Refund Processed — ElectroMart",
    html: `
      <p>Hi ${payment.order.customer.name},</p>
      <p>Your refund of <strong>${payment.amount} ${payment.currency}</strong> 
      for order <strong>#${orderId.slice(-6).toUpperCase()}</strong> has been processed.</p>
      <p>Refund ID: <code>${refundId}</code></p>
      <p>It may take 3-7 business days to reflect in your account.</p>
    `,
  });

  return { message: "Refund processed successfully", refundId };
};

// ── GET PAYMENT STATUS ────────────────────────────────────────────────────────

export const getPaymentByOrderId = async (
  orderId: string,
  customerId: string,
  isAdmin: boolean
) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: { select: { customerId: true } } },
  });

  if (!payment) throw new ApiError(404, "Payment not found");
  if (!isAdmin && payment.order.customerId !== customerId) {
    throw new ApiError(403, "Access denied");
  }

  return payment;
};