import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "crewos_session";
export const REF_COOKIE = "crewos_ref";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: string;
  wsId: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export function authEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

/** Demo login is on by default; explicitly disable with DEMO_MODE="false" in production. */
export function demoEnabled(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, wsId: payload.wsId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId === "string" && typeof payload.wsId === "string") {
      return { userId: payload.userId, wsId: payload.wsId };
    }
    return null;
  } catch {
    return null;
  }
}
