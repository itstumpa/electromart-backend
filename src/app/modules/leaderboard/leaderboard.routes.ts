import { Router } from "express";
import { getVendorLeaderboard } from "./leaderboard.controller";

const router = Router();
router.get("/", getVendorLeaderboard); // public

export const leaderboardRoute = router;