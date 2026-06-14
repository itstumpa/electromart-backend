import { Router } from "express";
import * as QAController from "./productQA.controller";

import { askQuestionSchema, answerQuestionSchema, moderateQuestionSchema } from "./productQA.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

// Public
router.get("/product/:productId",                                                   QAController.getProductQA);

// Customer
router.post("/product/:productId", authenticate, authorize("CUSTOMER"), validate(askQuestionSchema), QAController.askQuestion);

// Vendor
router.patch("/:questionId/answer",    authenticate, authorize("VENDOR"),  validate(answerQuestionSchema), QAController.answerQuestion);
router.get("/vendor/questions",        authenticate, authorize("VENDOR"),                                     QAController.getVendorQuestions);
router.patch("/:questionId/moderate",  authenticate, authorize("VENDOR", "ADMIN"), validate(moderateQuestionSchema), QAController.moderateQuestion);

// Admin
router.get("/admin/questions",         authenticate, authorize("ADMIN", "SUPER_ADMIN"),                      QAController.getAdminQuestions);

// Customer / Vendor / Admin
router.delete("/:questionId",          authenticate, authorize("CUSTOMER", "VENDOR", "ADMIN"),               QAController.deleteQuestion);

export const productQARoute = router;