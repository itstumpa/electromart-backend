// src/app/modules/order-tracking/orderTracking.routes.ts
import { Router } from "express";
import { getGuestTimeline, getTimeline } from "./orderTracking.controller";
import { authenticate } from "../../middlewares/authenticate";
import { guestOrderTrackerLimiter } from "../../middlewares/rateLimiter";

const router = Router();

// Authenticated users (CUSTOMER, VENDOR, ADMIN)
router.get("/:orderId/timeline", authenticate, getTimeline);

// Public guest tracking (by order ID + email, with rate limiting)
router.get("/:orderId/guest-timeline", guestOrderTrackerLimiter, getGuestTimeline);

export const orderTrackingRoute = router;