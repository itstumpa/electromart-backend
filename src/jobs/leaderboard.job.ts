// src/jobs/leaderboard.job.ts
import cron from "node-cron";
import { computeAndCacheLeaderboard } from "../app/modules/leaderboard/leaderboard.service";

// every Friday at 2:00 AM
export const startLeaderboardJob = () => {
  cron.schedule("0 2 * * 5", async () => {
    console.log("⏰ [CRON] Running weekly leaderboard job...");
    try {
      await computeAndCacheLeaderboard();
    } catch (err) {
      console.error("❌ Leaderboard job failed:", err);
    }
  });

  console.log("✅ Leaderboard cron job scheduled — every Friday 2:00 AM");
};