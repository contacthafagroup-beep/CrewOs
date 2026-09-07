import { NextResponse } from "next/server";
import { ensureDemoData } from "@/lib/demo-data";
import { demoEnabled, setSession } from "@/lib/auth/session";
import { authLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!demoEnabled()) {
    return NextResponse.json({ error: "Demo login is disabled (DEMO_MODE=false)" }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!authLimiter(ip)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute" }, { status: 429 });
  }
  const { userId, wsId } = await ensureDemoData();
  await setSession({ userId, wsId });
  return NextResponse.json({ ok: true });
}
