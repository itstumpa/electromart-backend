import { Router } from "express";
import { authRoute } from "../modules/auth/auth.routes";
import UserRoutes from "../modules/users/users.routes";
import { storeRoute } from "../modules/store/store.routes";
import { productRoute } from "../modules/product/product.routes";
import { categoryRoute } from "../modules/category/category.routes";
import { orderRoute } from "../modules/order/order.routes";
import { cartRoute } from "../modules/cart/cart.routes";
import { notificationRoute } from "../modules/notification/notification.routes";
import { vendorAnalyticsRoute } from "../modules/vendor-analytics/vendorAnalytics.routes";
import { returnRoute } from "../modules/return/return.routes";
import { reviewRoute } from "../review/review.routes";
import { adminRoute } from "../modules/admin/admin.routes";
import { couponRoute } from "../modules/coupon/coupon.routes";
//import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use("/auth", authRoute);
// router.use(authenticate);

router.use("/users", UserRoutes);
router.use("/stores", storeRoute);
router.use("/products", productRoute);
router.use("/category", categoryRoute);
router.use("/cart", cartRoute);
router.use("/orders", orderRoute);
router.use("/notifications", notificationRoute);
router.use("/returns", returnRoute);
router.use("/reviews", reviewRoute);
router.use("/coupons", couponRoute);



router.use("/admin", adminRoute);
router.use("/vendor/analytics", vendorAnalyticsRoute);

export default router;
