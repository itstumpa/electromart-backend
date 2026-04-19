// src/app/modules/admin/admin.routes.ts
import { Router } from "express";
import * as AdminController from "./admin.controller";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

// all admin routes locked down
router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", AdminController.getDashboardOverview);
router.get("/revenue/stores", AdminController.getRevenueByStore);
router.get("/payments/recent", AdminController.getRecentPayments);
router.get("/vendors", AdminController.getVendors);
router.get("/products/top-selling", AdminController.getTopSellingProducts);

export const adminRoute = router;