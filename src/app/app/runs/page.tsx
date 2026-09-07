import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, StatusBadge, EmptyState } from "@/components/ui";
import { fmtDateTime, fmtUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const runs = await prisma.agentRun.findMany({
    where: { workspaceId: session.wsId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Run history</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Every agent execution, metered and auditable.</p>
      </div>

      {runs.length === 0 ? (
        <EmptyState icon="🕐" title="No runs yet" body="Agent runs will show up here with full inputs, outputs, and cost." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="p-4">Agent</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tokens</th>
                <th className="p-4">Est. cost</th>
                <th className="p-4">When</th>
                <th className="p-4">Output</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800/60">
                  <td className="p-4 font-semibold capitalize">{r.agent}</td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                    {r.error && <div className="mt-1 max-w-52 truncate text-xs text-red-500" title={r.error}>{r.error}</div>}
                  </td>
                  <td className="p-4 text-zinc-500">{r.tokensIn + r.tokensOut > 0 ? `${(r.tokensIn / 1000).toFixed(1)}k / ${(r.tokensOut / 1000).toFixed(1)}k` : "—"}</td>
                  <td className="p-4 text-zinc-500">{fmtUsd(r.estCostCents)}</td>
                  <td className="p-4 text-zinc-500">{fmtDateTime(r.createdAt)}</td>
                  <td className="p-4">
                    {r.output ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-emerald-500">inspect</summary>
                        <pre className="mt-2 max-h-48 max-w-md overflow-auto rounded-lg bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-300">
                          {JSON.stringify(r.output, null, 2).slice(0, 2000)}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
