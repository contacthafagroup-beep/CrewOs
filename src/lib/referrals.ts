import { prisma } from "./db";
import { referralCreditCents } from "./referrals-core";

export { referralCreditCents, newReferralCode, isValidReferralCode } from "./referrals-core";

/** Credits the referring workspace $100 after a referred workspace's first paid subscription. */
export async function applyReferralCredit(
  referrerWorkspaceId: string,
  referredWorkspaceId: string | null,
  note: string,
): Promise<void> {
  const amount = referralCreditCents();
  await prisma.$transaction([
    prisma.referralLedger.create({
      data: { workspaceId: referrerWorkspaceId, referredWorkspaceId, amountCents: amount, note },
    }),
    prisma.workspace.update({
      where: { id: referrerWorkspaceId },
      data: { creditCents: { increment: amount } },
    }),
  ]);
}

export async function getReferralOverview(workspaceId: string) {
  const [ws, ledger] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { referralCode: true, creditCents: true } }),
    prisma.referralLedger.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return { referralCode: ws?.referralCode ?? "", creditCents: ws?.creditCents ?? 0, ledger };
}
