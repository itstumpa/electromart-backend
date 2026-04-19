// src/app/modules/vendor-analytics/vendorAnalytics.routes.ts
import { Router } from "express";
import { getMyAnalytics } from "./vendorAnalytics.controller";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.get("/", authenticate, authorize("VENDOR"), getMyAnalytics);

export const vendorAnalyticsRoute = router;