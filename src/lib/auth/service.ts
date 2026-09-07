import { prisma } from "../db";
import { newReferralCode } from "../referrals-core";

export interface EnsureResult {
  userId: string;
  wsId: string;
  isNewUser: boolean;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function createWorkspaceForUser(userId: string, name: string) {
  const base = slugify(name) || "workspace";
  const ws = await prisma.workspace.create({
    data: {
      name,
      slug: `${base}-${crypto.randomUUID().slice(0, 6)}`,
      referralCode: newReferralCode(),
      brandName: name,
    },
  });
  await prisma.membership.create({
    data: { userId, workspaceId: ws.id, role: "OWNER" },
  });
  return ws;
}

/**
 * Idempotently resolves a user from an identity (email or OAuth profile),
 * creating a personal workspace on first sign-in. Returns the active session ids.
 */
export async function ensureUserAndWorkspace(opts: {
  email: string;
  name?: string | null;
  referredByCode?: string | null;
  provider?: { id: string; providerAccountId: string };
}): Promise<EnsureResult> {
  const email = opts.email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email } });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email,
        name: opts.name ?? null,
        emailVerified: new Date(),
        referredByCode: opts.referredByCode ?? null,
        ...(opts.provider
          ? {
              oauthAccounts: {
                create: { provider: opts.provider.id, providerAccountId: opts.provider.providerAccountId },
              },
            }
          : {}),
      },
    });
  } else if (opts.provider) {
    await prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: opts.provider.id,
          providerAccountId: opts.provider.providerAccountId,
        },
      },
      create: { userId: user.id, provider: opts.provider.id, providerAccountId: opts.provider.providerAccountId },
      update: {},
    });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (membership) return { userId: user.id, wsId: membership.workspaceId, isNewUser };

  const ws = await createWorkspaceForUser(user.id, opts.name || `${email.split("@")[0]}'s Company`);
  return { userId: user.id, wsId: ws.id, isNewUser };
}
