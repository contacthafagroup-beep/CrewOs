import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LeadBoard, type LeadDTO, type LeadEmail } from "@/components/lead-board";
import { EmptyState, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await prisma.lead.findMany({
    where: { workspaceId: session.wsId },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const leads: LeadDTO[] = rows.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    domain: l.domain,
    score: l.score,
    scoreReasons: l.scoreReasons,
    status: l.status,
    emails: Array.isArray(l.emails) ? (l.emails as unknown as LeadEmail[]) : [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Lead pipeline</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Scored by the Outreach Agent. Move them through, nothing sends without you.</p>
        </div>
        <Link href="/app/agents/outreach">
          <Button>🎯 Run Outreach Agent</Button>
        </Link>
      </div>

      {leads.length === 0 ? (
        <EmptyState icon="🎯" title="No leads yet" body="Run the Outreach Agent with your ideal customer profile — scored leads and full sequences land here." />
      ) : (
        <LeadBoard initialLeads={leads} />
      )}
    </div>
  );
}
