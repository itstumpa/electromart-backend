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
import { paymentRoute } from "../modules/payment/payment.routes";
import { addressRoute } from "../address/address.routes";
import { orderTrackingRoute } from "../modules/order-tracking/orderTracking.routes";
import { tagRoute } from "../modules/tag/tag.routes";
import { productQARoute } from "../modules/product-qa/productQA.routes";
import { stockAlertRoute } from "../modules/stock-alert/stockAlert.routes";
import { leaderboardRoute } from "../modules/leaderboard/leaderboard.routes";
import { wishlistRoute } from "../modules/wishlist/wishlist.routes";
//import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use("/auth", authRoute);
// router.use(authenticate);

router.use("/users", UserRoutes);
router.use("/stores", storeRoute);
router.use("/products", productRoute);
router.use("/category", categoryRoute);
router.use("/categories", categoryRoute);
router.use("/cart", cartRoute);
router.use("/orders", orderRoute);
router.use("/notifications", notificationRoute);
router.use("/returns", returnRoute);
router.use("/reviews", reviewRoute);
router.use("/coupons", couponRoute);
router.use("/payments", paymentRoute);
router.use("/addresses", addressRoute);
router.use("/orderTracking", orderTrackingRoute);
router.use("/tags", tagRoute);
router.use("/qa", productQARoute);
router.use("/stock-alerts", stockAlertRoute);
router.use("/leaderboard", leaderboardRoute);
router.use("/wishlist", wishlistRoute);



router.use("/admin", adminRoute);
router.use("/vendor/analytics", vendorAnalyticsRoute);

export default router;
