// src/app/modules/notification/notification.routes.ts
import { Router } from "express";
import * as NotificationController from "./notification.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.use(authenticate);

// router.post("/", authorize("ADMIN"), NotificationController.sendNotification );
router.post("/", NotificationController.sendNotification );

router.get("/me", authenticate, NotificationController.getMyNotifications);

router.post( "/test", NotificationController.testNotification );

router.patch( "/me/email-notification", NotificationController.toggleEmailNotification );

router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/mark-all-read", NotificationController.markAllAsRead);

export const notificationRoute = router;