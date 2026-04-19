// src/app/modules/coupon/coupon.routes.ts
import { Router } from "express";
import * as CouponController from "./coupon.controller";
import { createCouponSchema, applyCouponSchema } from "./coupon.validation";
// import { authorize } from "passport";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// ADMIN
router.post("/", authenticate, authorize("ADMIN"), validate(createCouponSchema), CouponController.createCoupon);
router.get("/", authenticate, authorize("ADMIN"), CouponController.getAllCoupons);
router.patch("/:id/toggle", authenticate, authorize("ADMIN"), CouponController.toggleCoupon);
router.delete("/:id", authenticate, authorize("ADMIN"), CouponController.deleteCoupon);

// CUSTOMER — preview discount
router.post("/apply", authenticate, authorize("CUSTOMER"), validate(applyCouponSchema), CouponController.applyCouponToCart);

export const couponRoute = router;