// src/app/modules/order/order.routes.ts
import { Router } from "express";
import * as OrderController from "./order.controller";
import { authenticate } from "../../middlewares/authenticate";
import { optionalAuth, authenticateOrGuest } from "../../middlewares/guest";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  placeOrderSchema,
  placeGuestOrderSchema,
  trackGuestOrderSchema,
  updateOrderItemStatusSchema,
  updateOrderStatusSchema,
} from "./order.validation";
import { guestOrderTrackerLimiter } from "../../middlewares/rateLimiter";

const router = Router();

// ── Guest order routes ───────────────────────────────────────────────────────
router.post("/guest", optionalAuth, validate(placeGuestOrderSchema), OrderController.placeGuestOrder);
router.get("/guest/track/:orderId", guestOrderTrackerLimiter, validate(trackGuestOrderSchema), OrderController.trackGuestOrder);

// ── CUSTOMER ─────────────────────────────────────────────────────────────────
router.post("/", authenticate, authorize("CUSTOMER"), validate(placeOrderSchema), OrderController.placeOrder);
router.get("/my", authenticate, authorize("CUSTOMER"), OrderController.getMyOrders);
// Use authenticateOrGuest to support both authenticated users and guests
router.get("/:id", authenticateOrGuest, OrderController.getOrderById);
router.patch("/:id/cancel", authenticate, authorize("CUSTOMER"), OrderController.cancelOrder);

// ── VENDOR / ADMIN / SUPER_ADMIN ────────────────────────────────────────────
router.get("/vendor/items", authenticate, authorize("VENDOR"), OrderController.getVendorOrders);
router.patch("/vendor/items/:itemId/status", authenticate, authorize("VENDOR", "ADMIN", "SUPER_ADMIN"), validate(updateOrderItemStatusSchema), OrderController.updateOrderItemStatus);

// ── ADMIN ────────────────────────────────────────────────────────────────────
router.get("/", authenticate, authorize("ADMIN"), OrderController.getAllOrders);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderStatusSchema),
  OrderController.updateOrderStatus,
);
router.patch('/:id/admin-cancel', authenticate, authorize('ADMIN'), OrderController.adminCancelOrder);

export const orderRoute = router;