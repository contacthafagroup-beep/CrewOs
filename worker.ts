// Long-running worker: processes queued jobs every 5 seconds.
// Run with `npm run worker`. In production you can instead call
// POST /api/worker/tick from Vercel Cron (see DEPLOYMENT.md).

import { processPendingJobs } from "./src/lib/queue";
import { prisma } from "./src/lib/db";

async function loop(): Promise<void> {
  console.log("[worker] started — polling every 5s");
  for (;;) {
    try {
      const n = await processPendingJobs(5);
      if (n > 0) console.log(`[worker] processed ${n} job(s)`);
    } catch (e) {
      console.error("[worker] tick failed:", e);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

loop().finally(() => prisma.$disconnect());
