// src/app/modules/cart/cart.routes.ts
import { Router } from "express";
import * as CartController from "./cart.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema,
} from "./cart.validation";

const router = Router();

// all cart routes — customers only
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", CartController.viewCart);
router.post("/", validate(addToCartSchema), CartController.addToCart);

router.post("/merge", validate(mergeCartSchema), CartController.mergeCart);
router.patch("/:productId", validate(updateCartItemSchema), CartController.updateCartItem);

router.delete("/:productId", CartController.removeFromCart);
router.delete("/", CartController.clearCart);

export const cartRoute = router;