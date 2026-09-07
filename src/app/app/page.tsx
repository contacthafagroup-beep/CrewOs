import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { planFor, usagePercent, usageWarned } from "@/lib/plans";
import { summarizeUsage } from "@/lib/usage";
import { activeProviderId } from "@/lib/ai/router";
import { fmtUsd } from "@/lib/format";
import { Card, ProgressBar, Badge, StatusBadge, EmptyState } from "@/components/ui";
import { BarChart } from "@/components/charts";
import { AGENT_SPECS } from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ws = await prisma.workspace.findUnique({ where: { id: session.wsId } });
  if (!ws) redirect("/login");

  const usage = await summarizeUsage(ws.id);
  const plan = planFor(ws.plan);
  const pct = usagePercent(ws.plan, usage.runsThisMonth);

  const [recentRuns, pendingContent, leadCount] = await Promise.all([
    prisma.agentRun.findMany({ where: { workspaceId: ws.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.contentItem.count({ where: { workspaceId: ws.id, status: "DRAFT" } }),
    prisma.lead.count({ where: { workspaceId: ws.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Mission control</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{ws.name} · {plan.name} plan</p>
        </div>
        <Link
          href="/app/agents"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
        >
          + New agent run
        </Link>
      </div>

      {usageWarned(ws.plan, usage.runsThisMonth) && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <strong>Heads up:</strong> you&apos;ve used {usage.runsThisMonth}/{plan.runLimit} runs this month.{" "}
          <Link href="/app/billing" className="font-semibold text-amber-500 underline">
            Upgrade
          </Link>{" "}
          before your crew hits the ceiling.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Agent runs this month</div>
          <div className="mt-1 text-2xl font-black">{usage.runsThisMonth}<span className="text-sm font-semibold text-zinc-500">/{plan.runLimit}</span></div>
          <div className="mt-3"><ProgressBar percent={pct} /></div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Est. AI spend (month)</div>
          <div className="mt-1 text-2xl font-black">{fmtUsd(usage.monthCostCents)}</div>
          <div className="mt-3 text-xs text-zinc-500">
            provider: {activeProviderId()}
            {activeProviderId() === "mock" && " (mock — no keys)"}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Leads in pipeline</div>
          <div className="mt-1 text-2xl font-black">{leadCount}</div>
          <div className="mt-3"><Link href="/app/leads" className="text-xs font-semibold text-emerald-500 hover:underline">Open board →</Link></div>
        </Card>
        <Card>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Awaiting your approval</div>
          <div className="mt-1 text-2xl font-black">{pendingContent}</div>
          <div className="mt-3"><Link href="/app/content" className="text-xs font-semibold text-emerald-500 hover:underline">Review content →</Link></div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Runs per day (14d)</h2>
          <Badge tone="green">live usage</Badge>
        </div>
        <BarChart data={usage.daily.map((d) => ({ label: d.date.slice(5), value: d.runs }))} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {AGENT_SPECS.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">{a.icon}</span>
              <div>
                <div className="font-bold">{a.name}</div>
                <div className="text-xs text-zinc-500">{a.tagline}</div>
              </div>
            </div>
            <Link
              href={`/app/agents/${a.id}`}
              className="mt-4 block rounded-lg border border-zinc-200 py-2 text-center text-sm font-semibold transition hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-800"
            >
              Run agent
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent runs</h2>
          <Link href="/app/runs" className="text-xs font-semibold text-emerald-500 hover:underline">View all →</Link>
        </div>
        {recentRuns.length === 0 ? (
          <EmptyState icon="🤖" title="No runs yet" body="Hire your first AI employee and give it a task." />
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
            {recentRuns.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="font-medium capitalize">{r.agent}</span>
                </div>
                <span className="text-xs text-zinc-500">{r.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
