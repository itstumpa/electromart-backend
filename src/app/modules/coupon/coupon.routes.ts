// src/app/modules/coupon/coupon.routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as CouponController from "./coupon.controller";
import { createCouponSchema, updateCouponSchema, applyCouponSchema } from "./coupon.validation";
// import { authorize } from "passport";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authorize } from "../../middlewares/authorize";

const couponApplyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many coupon attempts, please try again after 15 minutes",
  },
});

const router = Router();

// PUBLIC — promotional coupons for top bar / banners
router.get("/promotions", CouponController.getPromotionalCoupons);

// ADMIN
router.post("/", authenticate, authorize("ADMIN"), validate(createCouponSchema), CouponController.createCoupon);
router.get("/", authenticate, authorize("ADMIN"), CouponController.getAllCoupons);
router.patch("/:id/toggle", authenticate, authorize("ADMIN"), CouponController.toggleCoupon);
router.patch("/:id", authenticate, authorize("ADMIN"), validate(updateCouponSchema), CouponController.updateCoupon);
router.delete("/:id", authenticate, authorize("ADMIN"), CouponController.deleteCoupon);

// CUSTOMER — preview discount
router.post("/apply", authenticate, authorize("CUSTOMER"), couponApplyLimiter, validate(applyCouponSchema), CouponController.applyCouponToCart);

export const couponRoute = router;