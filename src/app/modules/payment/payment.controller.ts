// src/app/modules/payment/payment.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import * as PaymentService from './payment.service';

// CUSTOMER — initiate payment
export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId, gateway } = req.body;
  const result = await PaymentService.initiatePayment(req.user!.id, orderId, gateway);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment initiated',
    data: result,
  });
});

// ── SSLCommerz redirects (no auth — SSLCommerz hits these) ───────────────────

export const sslCommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleSSLCommerzSuccess(req.body);
  // redirect to frontend success page
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&orderId=${result.orderId}`);
});

export const sslCommerzFail = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleSSLCommerzFail(req.body);
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=fail&orderId=${result.orderId}`);
});

export const sslCommerzCancel = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.body.tran_id;
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=cancel&orderId=${orderId}`);
});

export const sslCommerzIPN = catchAsync(async (req: Request, res: Response) => {
  await PaymentService.handleSSLCommerzIPN(req.body);
  res.status(200).json({ message: 'IPN received' });
});

// ── Stripe webhook (raw body needed) ─────────────────────────────────────────

export const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  await PaymentService.handleStripeWebhook(req.body, signature);
  res.status(200).json({ received: true });
});

// ADMIN — refund
export const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.refundPayment(req.params.orderId as string, req.body.reason);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: { refundId: result.refundId },
  });
});

// CUSTOMER/ADMIN — get payment status
export const getPaymentByOrderId = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const payment = await PaymentService.getPaymentByOrderId(req.params.orderId as string, req.user!.id, isAdmin);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment fetched',
    data: payment,
  });
});
