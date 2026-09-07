"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { fmtUsd } from "@/lib/format";

export interface PlanDTO {
  id: string;
  name: string;
  monthlyCents: number;
  annualCents: number;
  runLimit: number;
  seats: number;
  blurb: string;
  features: string[];
}

export function BillingPlans({
  plans,
  currentPlan,
  stripeEnabled,
  hasCustomer,
}: {
  plans: PlanDTO[];
  currentPlan: string;
  stripeEnabled: boolean;
  hasCustomer: boolean;
}) {
  const [annual, setAnnual] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planId: string) {
    setError(null);
    setBusy(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId, annual }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout unavailable");
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    setError(null);
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Portal unavailable");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!stripeEnabled && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-500">
          <strong>Stripe is not configured on this deployment.</strong> Plan buttons are disabled until{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">STRIPE_SECRET_KEY</code> and the{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">STRIPE_PRICE_*</code> ids are set — see DEPLOYMENT.md.
        </div>
      )}
      {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

      <div className="flex items-center justify-center gap-3 text-sm">
        <span className={!annual ? "font-bold" : "text-zinc-500"}>Monthly</span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className="relative h-6 w-11 rounded-full bg-zinc-300 transition dark:bg-zinc-700"
          aria-label="Toggle annual billing"
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${annual ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={annual ? "font-bold" : "text-zinc-500"}>Annual <span className="text-emerald-500">(2 months free)</span></span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlan;
          return (
            <Card key={p.id} className={isCurrent ? "border-emerald-500" : ""}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{p.name}</h3>
                {isCurrent && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">CURRENT</span>}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black">{fmtUsd(annual ? p.annualCents / 12 : p.monthlyCents)}</span>
                <span className="text-sm text-zinc-500">/mo</span>
              </div>
              {annual && <div className="mt-1 text-xs text-emerald-500">{fmtUsd(p.annualCents)}/yr — 2 months free</div>}
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{p.blurb}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                    <span className="mt-0.5 text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" onClick={portal} disabled={!stripeEnabled || busy !== null}>
                    {busy === "portal" ? "Opening…" : "Manage subscription"}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => checkout(p.id)} disabled={!stripeEnabled || busy !== null}>
                    {busy === p.id ? "Redirecting…" : `Switch to ${p.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-center text-sm text-zinc-500">
        Enterprise (SSO, custom agents, dedicated models): <a href="mailto:sales@crewos.app" className="font-semibold text-emerald-500">sales@crewos.app</a>
      </p>
    </div>
  );
}
