import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { planFor } from "@/lib/plans";
import { Card } from "@/components/ui";
import { InviteForm } from "@/components/invite-form";
import { Badge } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId: session.wsId } },
  });
  if (!membership) redirect("/login");

  const [ws, members] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session.wsId }, select: { plan: true } }),
    prisma.membership.findMany({
      where: { workspaceId: session.wsId },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const plan = planFor(ws?.plan);
  const canInvite = membership.role === "OWNER" || membership.role === "ADMIN";
  const seatPct = Math.min(100, Math.round((members.length / plan.seats) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Team</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {members.length} of {Number.isFinite(plan.seats) ? plan.seats : "∞"} seats used ({seatPct}%)
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Invite a teammate</h2>
        <InviteForm canInvite={canInvite} />
        {Number.isFinite(plan.seats) && members.length >= plan.seats && (
          <p className="mt-2 text-sm text-amber-500">
            You&apos;re at your plan&apos;s seat limit — upgrade to add more teammates.
          </p>
        )}
      </Card>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <th className="p-4">Member</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                <td className="p-4">
                  <div className="font-semibold">{m.user.name ?? m.user.email.split("@")[0]}</div>
                  <div className="text-xs text-zinc-500">{m.user.email}</div>
                </td>
                <td className="p-4">
                  <Badge tone={m.role === "OWNER" ? "green" : "zinc"}>{m.role}</Badge>
                </td>
                <td className="p-4 text-zinc-500">{fmtDate(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
