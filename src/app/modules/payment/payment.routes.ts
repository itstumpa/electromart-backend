// src/app/modules/payment/payment.routes.ts
import { Router } from "express";
import express from "express";
import * as PaymentController from "./payment.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { optionalAuth, authenticateOrGuest } from "../../middlewares/guest";


const router = Router();

// ── CUSTOMER — initiate ───────────────────────────────────────────────────────
router.post(
  "/initiate",
  authenticate,
  authorize("CUSTOMER"),
  PaymentController.initiatePayment
);

// ── GUEST — initiate ──────────────────────────────────────────────────────────
router.post(
  "/initiate/guest",
  optionalAuth,
  PaymentController.initiateGuestPayment
);

// ── CUSTOMER/ADMIN — get status ───────────────────────────────────────────────
router.get(
  "/order/:orderId",
  authenticateOrGuest,
  PaymentController.getPaymentByOrderId
);

// ── ADMIN — refund ────────────────────────────────────────────────────────────
router.post(
  "/refund/:orderId",
  authenticate,
  authorize("ADMIN"),
  PaymentController.refundPayment
);

// ── SSLCommerz redirects — NO auth (SSLCommerz posts here) ───────────────────
router.post("/sslcommerz/success", PaymentController.sslCommerzSuccess);
router.post("/sslcommerz/fail", PaymentController.sslCommerzFail);
router.post("/sslcommerz/cancel", PaymentController.sslCommerzCancel);
router.post("/sslcommerz/ipn", PaymentController.sslCommerzIPN);

// ── Stripe webhook — raw body REQUIRED ───────────────────────────────────────
// must use express.raw BEFORE json parser for this route only
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook
);

export const paymentRoute = router;