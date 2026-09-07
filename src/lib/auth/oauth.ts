// Minimal OAuth 2.0 (authorization code) for Google and Microsoft Entra ID.
// Providers are only "configured" when their client id+secret are present.

export interface OAuthProviderConfig {
  id: "google" | "microsoft";
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
}

export interface OAuthProfile {
  sub: string;
  email: string;
  name?: string | null;
}

export function getOAuthProvider(id: string): OAuthProviderConfig | null {
  if (id === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      id: "google",
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile",
      clientId,
      clientSecret,
    };
  }
  if (id === "microsoft") {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      id: "microsoft",
      authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userinfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      scope: "openid email profile",
      clientId,
      clientSecret,
    };
  }
  return null;
}

export function oauthProviderConfigured(id: string): boolean {
  return getOAuthProvider(id) !== null;
}

export function buildAuthorizeUrl(p: OAuthProviderConfig, redirectUri: string, state: string): string {
  const url = new URL(p.authorizeUrl);
  url.searchParams.set("client_id", p.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", p.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeCode(
  p: OAuthProviderConfig,
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(p.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: p.clientId,
      client_secret: p.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("OAuth token exchange returned no access_token");
  return data.access_token;
}

export async function fetchProfile(p: OAuthProviderConfig, accessToken: string): Promise<OAuthProfile> {
  const res = await fetch(p.userinfoUrl, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`OAuth userinfo failed (${res.status})`);
  const data = (await res.json()) as { sub?: string; email?: string; name?: string };
  if (!data.email) throw new Error("OAuth provider did not return an email");
  return { sub: data.sub ?? data.email, email: data.email, name: data.name ?? null };
}
