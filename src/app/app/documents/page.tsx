import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge, EmptyState, Button } from "@/components/ui";
import { fmtDate, fmtUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const docs = await prisma.document.findMany({
    where: { workspaceId: session.wsId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Documents</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Branded proposals and quotes, generated from briefs.</p>
        </div>
        <Link href="/app/agents/proposal">
          <Button>📄 Run Proposal Agent</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📄" title="No documents yet" body="Run the Proposal Agent with a client brief — branded, printable proposals appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {docs.map((d) => {
            const data = d.data as { totalCents?: number; currency?: string };
            return (
              <Link
                key={d.id}
                href={`/app/documents/${d.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Badge tone={d.type === "PROPOSAL" ? "green" : "blue"}>{d.type}</Badge>
                <div className="mt-3 font-bold">{d.title}</div>
                {data.totalCents !== undefined && (
                  <div className="mt-1 text-2xl font-black text-emerald-500">
                    {fmtUsd(data.totalCents)}
                  </div>
                )}
                <div className="mt-2 text-xs text-zinc-500">{fmtDate(d.createdAt)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
