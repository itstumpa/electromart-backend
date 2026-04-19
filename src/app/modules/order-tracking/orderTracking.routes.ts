// src/app/modules/order-tracking/orderTracking.routes.ts
import { Router } from "express";
import { getTimeline } from "./orderTracking.controller";
import { authenticate } from "../../middlewares/authenticate";
// import { authenticate } from "../../../middlewares/authenticate";

const router = Router();
router.get("/:orderId/timeline", authenticate, getTimeline);

export const orderTrackingRoute = router;