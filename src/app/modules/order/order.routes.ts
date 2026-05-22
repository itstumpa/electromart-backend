// src/app/modules/order/order.routes.ts
import { Router } from "express";
import * as OrderController from "./order.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  placeOrderSchema,
  updateOrderItemStatusSchema,
  updateOrderStatusSchema,
} from "./order.validation";

const router = Router();

// CUSTOMER
router.post("/", authenticate, authorize("CUSTOMER"), validate(placeOrderSchema), OrderController.placeOrder);
router.get("/my", authenticate, authorize("CUSTOMER"), OrderController.getMyOrders);
router.get("/:id", authenticate, OrderController.getOrderById);
router.patch("/:id/cancel", authenticate, authorize("CUSTOMER"), OrderController.cancelOrder);

// VENDOR
router.get("/vendor/items", authenticate, authorize("VENDOR"), OrderController.getVendorOrders);
router.patch("/vendor/items/:itemId/status", authenticate, authorize("VENDOR"), validate(updateOrderItemStatusSchema), OrderController.updateOrderItemStatus);

// ADMIN
router.get("/", authenticate, authorize("ADMIN"), OrderController.getAllOrders);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderStatusSchema),
  OrderController.updateOrderStatus,
);

export const orderRoute = router;