// src/app/modules/notification/notification.routes.ts
import { Router } from "express";
import * as NotificationController from "./notification.controller";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.getMyNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/mark-all-read", NotificationController.markAllAsRead);

export const notificationRoute = router;