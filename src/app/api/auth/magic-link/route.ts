import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, jsonOk, jsonErr, zEmail } from "@/lib/api";
import { authLimiter } from "@/lib/rate-limit";
import { sendEmail, shellEmail } from "@/lib/email";
import { createLoginFlow, cleanupExpiredFlows } from "@/lib/auth/login-flow";

export const dynamic = "force-dynamic";

const Body = z.object({ email: zEmail });

/**
 * Starts a cross-device login flow.
 * Returns flowToken (kept by this device) — the emailed link does NOT carry
 * any session material; it only approves the flow when clicked anywhere.
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (!authLimiter(ip)) return jsonErr(429, "Too many attempts — try again in a minute");

    const { email } = await parseBody(req, Body);
    const origin = process.env.APP_URL || new URL(req.url).origin;

    const flow = await createLoginFlow(email, origin);

    const res = await sendEmail({
      to: email,
      subject: "Confirm your CrewOS sign-in",
      html: shellEmail(
        "Confirm your sign-in",
        `<p>You requested a sign-in link for <strong>CrewOS</strong>.</p>
         <p>Click below to approve it — you can do this from <strong>any device</strong> (the device you're signing in from will continue automatically).</p>
         <p style="color:#71717a">If you didn't request this, ignore this email — the request expires in 15 minutes.</p>`,
        { label: "Approve sign-in", url: flow.link },
      ),
    });
    if (!res.delivered) {
      console.log(`[auth] magic-link approve URL for ${email}: ${flow.link}`);
    }

    void cleanupExpiredFlows().catch(() => {});

    return jsonOk({ ok: true, flowToken: flow.flowToken });
  } catch (e) {
    if (e instanceof Error && e.name === "FlowCooldown") return jsonErr(429, e.message);
    if (e instanceof Error && e.name === "ApiError") return jsonErr(400, e.message);
    console.error("[auth/magic-link]", e);
    return jsonErr(500, "Could not send sign-in link");
  }
}
