import { Router } from "express";
import { getVendorLeaderboard } from "./leaderboard.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", getVendorLeaderboard);

export const leaderboardRoute = router;