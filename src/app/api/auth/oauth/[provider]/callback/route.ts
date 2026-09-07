import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, fetchProfile, getOAuthProvider } from "@/lib/auth/oauth";
import { ensureUserAndWorkspace } from "@/lib/auth/service";
import { setSession, REF_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function redirectError(origin: string, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${code}`, origin), 302);
}

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const p = getOAuthProvider(provider);
  if (!p) return redirectError(origin, "oauth_not_configured");

  const store = await cookies();
  const expectedState = store.get("crewos_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectError(origin, "oauth_state_mismatch");
  }
  store.delete("crewos_oauth_state");

  try {
    const accessToken = await exchangeCode(p, code, `${origin}/api/auth/oauth/${provider}/callback`);
    const profile = await fetchProfile(p, accessToken);
    const referredByCode = store.get(REF_COOKIE)?.value ?? null;
    const { userId, wsId } = await ensureUserAndWorkspace({
      email: profile.email,
      name: profile.name,
      referredByCode,
      provider: { id: p.id, providerAccountId: profile.sub },
    });
    await setSession({ userId, wsId });
    return NextResponse.redirect(new URL("/app", origin), 302);
  } catch (e) {
    console.error("[oauth/callback]", e);
    return redirectError(origin, "oauth_failed");
  }
}
