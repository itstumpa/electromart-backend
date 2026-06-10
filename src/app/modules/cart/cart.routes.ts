// src/app/modules/cart/cart.routes.ts
import { Router } from "express";
import * as CartController from "./cart.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  addToCartSchema,
  addToCartByProductIdSchema,
  updateCartItemSchema,
  mergeCartSchema,
} from "./cart.validation";
import { applyCouponSchema } from "../coupon/coupon.validation";

const router = Router();

// all cart routes — customers only
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", CartController.viewCart);
router.post("/", validate(addToCartSchema), CartController.addToCart);

router.post("/merge", validate(mergeCartSchema), CartController.mergeCart);

// Coupon routes — must appear BEFORE /:productId to avoid wildcard capture
router.post("/coupon", validate(applyCouponSchema), CartController.applyCartCoupon);
router.delete("/coupon", CartController.removeCartCoupon);

router.post(
  "/:productId",
  validate(addToCartByProductIdSchema),
  CartController.addToCartByProductId,
);
router.patch("/:productId", validate(updateCartItemSchema), CartController.updateCartItem);

router.delete("/:productId", CartController.removeFromCart);
router.delete("/", CartController.clearCart);

export const cartRoute = router;