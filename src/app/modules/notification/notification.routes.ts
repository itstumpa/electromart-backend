import { Router, Request, Response } from "express";
// src/app/modules/notification/notification.routes.ts
import * as NotificationController from "./notification.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import catchAsync from "../../../utils/catchAsync";
import { prisma } from "../../../lib/prisma";
import sendResponse from "../../../utils/sendResponse";

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
router.post("/push/subscribe", authenticate, catchAsync(async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: req.user!.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  sendResponse(res, { statusCode: 201, success: true, message: "Push subscription saved", data: null });
}));
router.get("/push/vapid-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export const notificationRoute = router;