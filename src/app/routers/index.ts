import { Router } from 'express';
import { addressRoute } from '../modules/address/address.routes';
import { adminRoute } from '../modules/admin/admin.routes';
import { authRoute } from '../modules/auth/auth.routes';
import { cartRoute } from '../modules/cart/cart.routes';
import { categoryRoute } from '../modules/category/category.routes';
import { couponRoute } from '../modules/coupon/coupon.routes';
import { leaderboardRoute } from '../modules/leaderboard/leaderboard.routes';
import { notificationRoute } from '../modules/notification/notification.routes';
import { orderTrackingRoute } from '../modules/order-tracking/orderTracking.routes';
import { orderRoute } from '../modules/order/order.routes';
import { paymentRoute } from '../modules/payment/payment.routes';
import { productQARoute } from '../modules/product-qa/productQA.routes';
import { productRoute } from '../modules/product/product.routes';
import { returnRoute } from '../modules/return/return.routes';
import { reviewRoute } from '../modules/review/review.routes';
import { stockAlertRoute } from '../modules/stock-alert/stockAlert.routes';
import { storeRoute } from '../modules/store/store.routes';
import { tagRoute } from '../modules/tag/tag.routes';
import UserRoutes from '../modules/users/users.routes';
import { vendorAnalyticsRoute } from '../modules/vendor-analytics/vendorAnalytics.routes';
import { wishlistRoute } from '../modules/wishlist/wishlist.routes';
import { payoutRoute } from '../modules/payout/payout.routes';
import { brandRoute } from '../modules/brand/brand.routes';
//import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use('/auth', authRoute);
// router.use(authenticate);

router.use('/users', UserRoutes);
router.use('/stores', storeRoute);
router.use('/products', productRoute);
router.use('/category', categoryRoute);
router.use('/categories', categoryRoute);
router.use('/cart', cartRoute);
router.use('/orders', orderRoute);
router.use('/notifications', notificationRoute);
router.use('/returns', returnRoute);
router.use('/reviews', reviewRoute);
router.use('/coupons', couponRoute);
router.use('/payments', paymentRoute);
router.use('/addresses', addressRoute);
router.use('/orderTracking', orderTrackingRoute);
router.use('/tags', tagRoute);
router.use('/qa', productQARoute);
router.use('/stock-alerts', stockAlertRoute);
router.use('/leaderboard', leaderboardRoute);
router.use('/wishlist', wishlistRoute);

router.use('/admin', adminRoute);
router.use('/vendor-analytics', vendorAnalyticsRoute);
router.use('/payouts', payoutRoute);
router.use('/brands', brandRoute );

export default router;
