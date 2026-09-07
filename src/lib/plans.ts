// Plan configuration + limit math. Pure — no I/O. Money in integer cents.

export type PlanTier = "STARTER" | "GROWTH" | "SCALE" | "ENTERPRISE";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  monthlyCents: number;
  annualCents: number; // 10× monthly — 2 months free
  runLimit: number; // agent runs per calendar month
  seats: number;
  blurb: string;
  features: string[];
}

export const PLANS: Record<Exclude<PlanTier, "ENTERPRISE">, PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyCents: 19900,
    annualCents: 19900 * 10,
    runLimit: 100,
    seats: 1,
    blurb: "Replace one freelancer. Ship the boring work on autopilot.",
    features: [
      "3 AI employees (Outreach, Content, Proposal)",
      "100 agent runs / month",
      "1 seat",
      "Email support",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    monthlyCents: 49900,
    annualCents: 49900 * 10,
    runLimit: 500,
    seats: 5,
    blurb: "Your always-on growth team. Most popular with agencies.",
    features: [
      "Everything in Starter",
      "500 agent runs / month",
      "5 seats",
      "Balanced model routing",
      "Usage analytics",
      "Priority email support",
    ],
  },
  SCALE: {
    id: "SCALE",
    name: "Scale",
    monthlyCents: 99900,
    annualCents: 99900 * 10,
    runLimit: 1500,
    seats: 15,
    blurb: "Run the whole back office with AI headcount.",
    features: [
      "Everything in Growth",
      "1,500 agent runs / month",
      "15 seats",
      "Premium model routing",
      "Priority queue",
      "Dedicated support channel",
    ],
  },
};

export const PLAN_ORDER: PlanTier[] = ["STARTER", "GROWTH", "SCALE", "ENTERPRISE"];

export function annualPriceCents(monthlyCents: number): number {
  return monthlyCents * 10;
}

export function planFor(tier: string | null | undefined): PlanConfig {
  if (tier === "STARTER" || tier === "GROWTH" || tier === "SCALE") return PLANS[tier];
  if (tier === "ENTERPRISE") return { ...PLANS.SCALE, id: "ENTERPRISE", name: "Enterprise", runLimit: Number.MAX_SAFE_INTEGER, seats: Number.MAX_SAFE_INTEGER };
  return PLANS.STARTER;
}

export function runsRemaining(tier: string | null | undefined, usedThisMonth: number): number {
  return Math.max(0, planFor(tier).runLimit - usedThisMonth);
}

export function isOverLimit(tier: string | null | undefined, usedThisMonth: number): boolean {
  return usedThisMonth >= planFor(tier).runLimit;
}

export function usagePercent(tier: string | null | undefined, usedThisMonth: number): number {
  const limit = planFor(tier).runLimit;
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, Math.round((usedThisMonth / limit) * 100));
}

export function usageWarned(tier: string | null | undefined, usedThisMonth: number): boolean {
  return usagePercent(tier, usedThisMonth) >= 80;
}

/** Referral reward: $100 account credit per paid referral. */
export const REFERRAL_CREDIT_CENTS = 10000;
