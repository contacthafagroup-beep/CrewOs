import { NextResponse } from "next/server";
import { buildAuthorizeUrl, getOAuthProvider } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const p = getOAuthProvider(provider);
  if (!p) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin), 302);
  }
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
  const url = buildAuthorizeUrl(p, redirectUri, state);
  const resp = NextResponse.redirect(url, 302);
  resp.cookies.set("crewos_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return resp;
}
