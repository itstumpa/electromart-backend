import { Router } from "express";
import * as StockAlertController from "./stockAlert.controller";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authenticate";


const router = Router();
router.use(authenticate, authorize("CUSTOMER"));

router.get("/",                             StockAlertController.getMyAlerts);
router.post("/:productId/subscribe",        StockAlertController.subscribe);
router.delete("/:productId/unsubscribe",    StockAlertController.unsubscribe);

export const stockAlertRoute = router;