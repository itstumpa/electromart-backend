import { Router } from "express";
import * as QAController from "./productQA.controller";
import { authenticate } from "../../../middlewares/authenticate";
import { authorize } from "../../../middlewares/authorize";
import { validateRequest } from "../../../middlewares/validateRequest";
import { askQuestionSchema, answerQuestionSchema } from "./productQA.validation";

const router = Router();

router.get("/product/:productId",                                                   QAController.getProductQA);
router.post("/product/:productId", authenticate, authorize("CUSTOMER"), validateRequest(askQuestionSchema), QAController.askQuestion);
router.patch("/:questionId/answer", authenticate, authorize("VENDOR"),  validateRequest(answerQuestionSchema), QAController.answerQuestion);
router.delete("/:questionId",      authenticate, authorize("CUSTOMER", "ADMIN"),   QAController.deleteQuestion);

export const productQARoute = router;