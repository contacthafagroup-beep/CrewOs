import { NextResponse } from "next/server";
import { ensureUserAndWorkspace } from "@/lib/auth/service";
import { approveLoginFlow } from "@/lib/auth/login-flow";

export const dynamic = "force-dynamic";

/**
 * The device that opens the emailed link lands here (phone, tablet, anything).
 * It does NOT sign this device in — it approves the waiting flow so the
 * requesting device (which is polling) completes its own login.
 */
export async function GET(req: Request) {
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const linkToken = new URL(req.url).searchParams.get("link_token");
  if (!linkToken) return NextResponse.redirect(new URL("/login?error=missing_token", origin), 302);

  const result = await approveLoginFlow(linkToken, async (email) =>
    ensureUserAndWorkspace({ email }),
  );

  const page = (state: "ok" | "invalid" | "expired") => `
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CrewOS — sign-in ${state === "ok" ? "approved" : "link problem"}</title></head>
<body style="margin:0;background:#09090b;color:#e4e4e7;font-family:ui-sans-serif,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
  <div style="max-width:420px;width:100%;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;text-align:center">
    <div style="font-size:32px">${state === "ok" ? "✅" : "⚠️"}</div>
    <h1 style="font-size:20px;margin:12px 0 8px">${
      state === "ok"
        ? "Approved! Head back to your other device."
        : state === "expired"
          ? "This link expired."
          : "This link is invalid or already used."
    }</h1>
    <p style="font-size:14px;color:#a1a1aa;line-height:1.6">${
      state === "ok"
        ? "The device you signed in from will continue on its own — nothing else to do here."
        : "Request a fresh sign-in link from the device you're signing in on."
    }</p>
    <div style="margin-top:20px"><a href="${origin}/login" style="color:#10b981;font-weight:700;text-decoration:none">CrewOS</a></div>
  </div>
</body></html>`;

  const status = result.status === "approved" ? "ok" : result.status === "expired" ? "expired" : "invalid";
  return new NextResponse(page(status as "ok" | "invalid" | "expired"), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
