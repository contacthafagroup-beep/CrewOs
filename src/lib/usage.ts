import { prisma } from "./db";
import { planFor } from "./plans";

export function monthStartUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export interface UsageSummary {
  runsThisMonth: number;
  monthCostCents: number;
  daily: { date: string; runs: number; costCents: number }[];
  byAgent: { agent: string; runs: number; costCents: number; tokensIn: number; tokensOut: number }[];
}

/** Aggregates the last 14 days of usage + current-month totals for a workspace. */
export async function summarizeUsage(workspaceId: string): Promise<UsageSummary> {
  const since = new Date(Date.now() - 13 * 24 * 3600 * 1000);
  const events = await prisma.usageEvent.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    select: { createdAt: true, agent: true, estCostCents: true, tokensIn: true, tokensOut: true },
  });

  const byDay = new Map<string, { runs: number; costCents: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - (13 - i) * 24 * 3600 * 1000);
    byDay.set(d.toISOString().slice(0, 10), { runs: 0, costCents: 0 });
  }
  const byAgent = new Map<string, { runs: number; costCents: number; tokensIn: number; tokensOut: number }>();
  let monthCostCents = 0;

  const monthStart = monthStartUtc();
  for (const ev of events) {
    const day = ev.createdAt.toISOString().slice(0, 10);
    const slot = byDay.get(day);
    if (slot) {
      slot.runs += 1;
      slot.costCents += ev.estCostCents;
    }
    const agg = byAgent.get(ev.agent) ?? { runs: 0, costCents: 0, tokensIn: 0, tokensOut: 0 };
    agg.runs += 1;
    agg.costCents += ev.estCostCents;
    agg.tokensIn += ev.tokensIn;
    agg.tokensOut += ev.tokensOut;
    byAgent.set(ev.agent, agg);
    if (ev.createdAt >= monthStart) monthCostCents += ev.estCostCents;
  }

  const runsThisMonth = await prisma.agentRun.count({
    where: { workspaceId, createdAt: { gte: monthStart } },
  });

  return {
    runsThisMonth,
    monthCostCents,
    daily: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    byAgent: [...byAgent.entries()].map(([agent, v]) => ({ agent, ...v })),
  };
}

export function planLimitFor(tier: string | null | undefined): number {
  return planFor(tier).runLimit;
}
