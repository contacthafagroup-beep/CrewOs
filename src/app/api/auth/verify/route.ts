import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ensureUserAndWorkspace } from "@/lib/auth/service";
import { setSession, REF_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirect(origin: string, dest: string): NextResponse {
  return NextResponse.redirect(new URL(dest, origin), 302);
}

export async function GET(req: Request) {
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return redirect(origin, "/login?error=missing_token");

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires < new Date()) {
    if (vt) await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return redirect(origin, "/login?error=invalid_token");
  }
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  const refCookie = await cookies();
  const referredByCode = refCookie.get(REF_COOKIE)?.value ?? null;
  const { userId, wsId } = await ensureUserAndWorkspace({
    email: vt.identifier,
    referredByCode,
  });
  await setSession({ userId, wsId });
  return redirect(origin, "/app");
}
