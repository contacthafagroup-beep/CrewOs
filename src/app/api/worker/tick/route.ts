import { processPendingJobs } from "@/lib/queue";
import { jsonOk, jsonErr } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Worker endpoint for Vercel Cron / uptime pings. Secure with WORKER_TOKEN. */
export async function POST(req: Request) {
  const expected = process.env.WORKER_TOKEN;
  if (!expected) return jsonErr(501, "WORKER_TOKEN not configured");
  if (req.headers.get("x-worker-token") !== expected) return jsonErr(401, "Invalid worker token");
  const processed = await processPendingJobs(5);
  return jsonOk({ processed });
}

export async function GET(req: Request) {
  return POST(req);
}
