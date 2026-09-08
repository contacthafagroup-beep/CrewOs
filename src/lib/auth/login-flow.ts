import { prisma } from "../db";

/**
 * Cross-device magic-link login (the Slack/Notion pattern).
 *
 * 1. Device A (laptop) POSTs the user's email → gets { flowToken } back and
 *    shows "Check your email" while polling /api/auth/magic-link/claim.
 * 2. The emailed link goes to Device B (phone). Opening it calls /approve,
 *    which marks the flow approved (and, for a NEW user, creates the account
 *    immediately so the poller can sign in).
 * 3. Device A's next poll sees approved=true, consumes the flow exactly once,
 *    and receives its own session payload — minted by Device A's own request,
 *    so no session secret ever travels through email or the other device.
 *
 * flowToken: long random string shown/kept only by the requesting device.
 * linkToken: long random string embedded in the emailed URL.
 * Both expire; consumption is single-use and race-safe via conditional update.
 */

const FLOW_TTL_MS = 15 * 60_000;
const EMAIL_RESEND_COOLDOWN_MS = 60_000;

export interface FlowCreated {
  flowToken: string;
  link: string;
  resendAvailableAt: number;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createLoginFlow(email: string, origin: string): Promise<FlowCreated> {
  const identifier = email.toLowerCase().trim();

  // Rate-limit repeat sends for the same address (authLimiter caps per-IP upstream).
  const recent = await prisma.loginFlow.findFirst({
    where: { identifier, createdAt: { gte: new Date(Date.now() - EMAIL_RESEND_COOLDOWN_MS) } },
    select: { createdAt: true },
  });
  if (recent) {
    throw Object.assign(new Error("A sign-in link was just sent. Check your inbox — you can resend in a minute."), {
      name: "FlowCooldown",
    });
  }

  const flowToken = randomToken();
  const linkToken = randomToken();
  const expiresAt = new Date(Date.now() + FLOW_TTL_MS);

  await prisma.loginFlow.create({
    data: { flowToken, identifier, token: linkToken, expiresAt },
  });

  return {
    flowToken,
    link: `${origin}/api/auth/magic-link/approve?link_token=${linkToken}`,
    resendAvailableAt: Date.now() + EMAIL_RESEND_COOLDOWN_MS,
  };
}

export async function approveLoginFlow(
  linkToken: string,
  ensureIdentity: (email: string) => Promise<{ userId: string; wsId: string }>,
): Promise<{ status: "approved" | "invalid" | "expired" }> {
  const flow = await prisma.loginFlow.findUnique({ where: { token: linkToken } });
  if (!flow) return { status: "invalid" };
  if (flow.expiresAt < new Date()) return { status: "expired" };

  // Ensure the account/workspace exists NOW so the poller can sign straight in.
  await ensureIdentity(flow.identifier);

  await prisma.loginFlow.updateMany({
    where: { id: flow.id, approvedAt: null },
    data: { approvedAt: new Date() },
  });
  return { status: "approved" };
}

export type ClaimResult =
  | { status: "pending" }
  | { status: "complete"; userId: string; wsId: string }
  | { status: "invalid" };

export async function claimLoginFlow(
  flowToken: string,
  ensureIdentity: (email: string) => Promise<{ userId: string; wsId: string }>,
): Promise<ClaimResult> {
  const flow = await prisma.loginFlow.findUnique({ where: { flowToken } });
  if (!flow || flow.expiresAt < new Date()) return { status: "invalid" };

  if (!flow.approvedAt || flow.consumedAt) return { status: "pending" };

  // Single consumption: conditional update wins on exactly one poll.
  const won = await prisma.loginFlow.updateMany({
    where: { id: flow.id, consumedAt: null, approvedAt: { not: null } },
    data: { consumedAt: new Date() },
  });
  if (won.count !== 1) return { status: "pending" };

  const { userId, wsId } = await ensureIdentity(flow.identifier);
  return { status: "complete", userId, wsId };
}

export async function cleanupExpiredFlows(): Promise<void> {
  await prisma.loginFlow.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 3600_000) } } });
}
