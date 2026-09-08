import { z } from "zod";
import { parseBody, jsonOk, jsonErr } from "@/lib/api";
import { authLimiter } from "@/lib/rate-limit";
import { ensureUserAndWorkspace } from "@/lib/auth/service";
import { setSession } from "@/lib/auth/session";
import { claimLoginFlow } from "@/lib/auth/login-flow";

export const dynamic = "force-dynamic";

const Body = z.object({ flowToken: z.string().min(32).max(128) });

/**
 * The requesting device polls this while showing "Check your email".
 * When the flow is approved, THIS request (from the waiting device itself)
 * mints and sets that device's session cookie — no session secret ever
 * travels through the email or the approving device.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (!authLimiter(`claim:${ip}`)) return jsonErr(429, "Slow down");

    const { flowToken } = await parseBody(req, Body);
    const result = await claimLoginFlow(flowToken, async (email) =>
      ensureUserAndWorkspace({ email }),
    );

    if (result.status === "invalid") return jsonErr(404, "This sign-in request no longer exists");
    if (result.status === "pending") return jsonOk({ status: "pending" });

    await setSession({ userId: result.userId, wsId: result.wsId });
    return jsonOk({ status: "complete" });
  } catch (e) {
    console.error("[auth/magic-link/claim]", e);
    return jsonErr(500, "Claim failed");
  }
}
