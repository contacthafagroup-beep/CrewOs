import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AGENT_SPECS } from "@/lib/agents/registry";
import { activeProviderId } from "@/lib/ai/router";
import { RunAgentForm } from "@/components/run-agent-form";
import { StatusBadge } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spec = AGENT_SPECS.find((a) => a.id === id);
  if (!spec) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const runs = await prisma.agentRun.findMany({
    where: { workspaceId: session.wsId, agent: id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">{spec.icon}</span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{spec.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{spec.tagline}</p>
        </div>
        <Link href="/app/agents" className="ml-auto text-sm font-semibold text-zinc-500 hover:text-emerald-500">
          ← All agents
        </Link>
      </div>

      <RunAgentForm spec={spec} aiConfigured={activeProviderId() !== "mock"} />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 font-bold">Recent {spec.name} runs</h2>
        {runs.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">No runs yet — this agent is fresh on the payroll.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-zinc-500">
                    {(r.input as Record<string, string>)?.icp ||
                      (r.input as Record<string, string>)?.topic ||
                      (r.input as Record<string, string>)?.clientName ||
                      "—"}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">{fmtDateTime(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
