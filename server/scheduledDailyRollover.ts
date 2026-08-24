import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  archivePreviousTurkeyDay,
  DAILY_ROLLOVER_JOB_KEY,
  getSystemJobByTaskUid,
} from "./db";

export async function runDailyRollover(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    const job = await getSystemJobByTaskUid(user.taskUid);
    if (!job || job.jobKey !== DAILY_ROLLOVER_JOB_KEY) {
      return res.status(403).json({ error: "unknown-scheduled-job" });
    }
    const result = await archivePreviousTurkeyDay();
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled task error";
    return res.status(500).json({
      error: message,
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
