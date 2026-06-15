// // src/app/modules/admin/admin.routes.ts
// import { Router } from "express";
// import * as AdminController from "./admin.controller";
// import { authorize } from "../../middlewares/authorize";
// import { authenticate } from "../../middlewares/authenticate";

// const router = Router();

// // all admin routes locked down
// router.use(authenticate, authorize("ADMIN"));

// router.get("/dashboard", AdminController.getDashboardOverview);
// router.get("/revenue/stores", AdminController.getRevenueByStore);
// router.get("/payments/recent", AdminController.getRecentPayments);
// router.get("/vendors", AdminController.getVendors);
// router.get("/products/top-selling", AdminController.getTopSellingProducts);

// export const adminRoute = router;

import express from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import * as AdminController from './admin.controller';

import {
  recentPaymentsValidation,
  revenueByStoreValidation,
  topSellingProductsValidation,
  vendorsValidation,
} from './admin.validation';

const router = express.Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'));

/**
 * Only SUPER_ADMIN / ADMIN should access these routes
 */
router.get('/overview', AdminController.getDashboardOverview);

router.get(
  '/revenue-by-store',

  validate(revenueByStoreValidation),
  AdminController.getRevenueByStore
);

router.get(
  '/recent-payments',

  validate(recentPaymentsValidation),
  AdminController.getRecentPayments
);

router.get(
  '/vendors',

  validate(vendorsValidation),
  AdminController.getVendors
);

router.get('/top-products', validate(topSellingProductsValidation), AdminController.getTopSellingProducts);

export const adminRoute = router;
