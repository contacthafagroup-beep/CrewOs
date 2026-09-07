import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { summarizeUsage } from "@/lib/usage";
import { fmtUsd } from "@/lib/format";
import { stripeEnabled } from "@/lib/stripe";
import { BillingPlans, type PlanDTO } from "@/components/billing-plans";
import { Card, ProgressBar, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const ws = await prisma.workspace.findUnique({
    where: { id: session.wsId },
    include: { subscription: true },
  });
  if (!ws) redirect("/login");

  const usage = await summarizeUsage(ws.id);
  const plan = PLANS[ws.plan as keyof typeof PLANS] ?? PLANS.STARTER;
  const pct = Math.min(100, Math.round((usage.runsThisMonth / plan.runLimit) * 100));

  const planDtos: PlanDTO[] = [PLANS.STARTER, PLANS.GROWTH, PLANS.SCALE].map((p) => ({
    id: p.id,
    name: p.name,
    monthlyCents: p.monthlyCents,
    annualCents: p.annualCents,
    runLimit: p.runLimit,
    seats: p.seats,
    blurb: p.blurb,
    features: p.features,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Billing</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Plans, usage, and account credits.</p>
      </div>

      {checkout === "success" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-500">
          🎉 Subscription started — your crew just got a bigger payroll. It may take a few seconds for the webhook to sync.
        </div>
      )}
      {checkout === "cancel" && (
        <div className="rounded-xl border border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">Checkout canceled — no changes made.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Current plan</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-black">
            {plan.name}
            {ws.subscription && <StatusBadge status={ws.subscription.status} />}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {fmtUsd(plan.monthlyCents)}/mo · {plan.runLimit} runs · {plan.seats} seat{plan.seats > 1 ? "s" : ""}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Runs this month</div>
          <div className="mt-1 text-2xl font-black">{usage.runsThisMonth}<span className="text-sm text-zinc-500">/{plan.runLimit}</span></div>
          <div className="mt-3"><ProgressBar percent={pct} /></div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Account credit</div>
          <div className="mt-1 text-2xl font-black text-emerald-500">{fmtUsd(ws.creditCents)}</div>
          <div className="mt-1 text-xs text-zinc-500">from referrals — applied at renewal</div>
        </Card>
      </div>

      {ws.subscription?.currentPeriodEnd && (
        <p className="text-xs text-zinc-500">
          Current period ends {ws.subscription.currentPeriodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
        </p>
      )}

      <BillingPlans
        plans={planDtos}
        currentPlan={ws.plan}
        stripeEnabled={stripeEnabled()}
        hasCustomer={!!ws.stripeCustomerId}
      />
    </div>
  );
}
