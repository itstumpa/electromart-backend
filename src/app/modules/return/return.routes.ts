// src/app/modules/return/return.routes.ts
import { Router } from "express";
import * as ReturnController from "./return.controller";
import { createReturnSchema, resolveReturnSchema } from "./return.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

// CUSTOMER
router.post(
  "/order-item/:orderItemId",
  authenticate,
  authorize("CUSTOMER"),
  validate(createReturnSchema),
  ReturnController.createReturnRequest
);
router.get(
  "/my",
  authenticate,
  authorize("CUSTOMER"),
  ReturnController.getMyReturnRequests
);

// VENDOR
router.get(
  "/vendor",
  authenticate,
  authorize("VENDOR"),
  ReturnController.getVendorReturnRequests
);
router.patch(
  "/:returnId/resolve",
  authenticate,
  authorize("VENDOR"),
  validate(resolveReturnSchema),
  ReturnController.resolveReturnRequest
);

export const returnRoute = router;