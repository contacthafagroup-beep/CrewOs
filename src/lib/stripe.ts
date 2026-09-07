import Stripe from "stripe";
import { ApiError } from "./errors";
import type { PlanTier } from "./plans";

let cached: Stripe | null = null;

export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ApiError(501, "Stripe is not configured. Set STRIPE_SECRET_KEY (see DEPLOYMENT.md).");
  }
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cached;
}

export function priceIdFor(tier: PlanTier, annual: boolean): string | null {
  if (tier === "ENTERPRISE") return null;
  const key = `STRIPE_PRICE_${tier}_${annual ? "ANNUAL" : "MONTHLY"}`;
  return process.env[key] || null;
}

export function planFromPriceId(priceId: string): PlanTier | null {
  for (const tier of ["STARTER", "GROWTH", "SCALE"] as const) {
    if (priceIdFor(tier, false) === priceId || priceIdFor(tier, true) === priceId) return tier;
  }
  return null;
}

const SUB_STATUS_MAP: Record<string, "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE",
};

export function mapStripeStatus(s: string): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  return SUB_STATUS_MAP[s] ?? "INCOMPLETE";
}
