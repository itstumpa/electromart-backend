import { Router } from "express";
import * as QAController from "./productQA.controller";

import { askQuestionSchema, answerQuestionSchema } from "./productQA.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

router.get("/product/:productId",                                                   QAController.getProductQA);
router.post("/product/:productId", authenticate, authorize("CUSTOMER"), validate(askQuestionSchema), QAController.askQuestion);
router.patch("/:questionId/answer", authenticate, authorize("VENDOR"),  validate(answerQuestionSchema), QAController.answerQuestion);
router.delete("/:questionId",      authenticate, authorize("CUSTOMER", "ADMIN"),   QAController.deleteQuestion);

export const productQARoute = router;