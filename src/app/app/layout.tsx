import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId: session.wsId } },
    include: { workspace: { select: { name: true, plan: true } } },
  });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  if (!membership || !user) redirect("/login");

  const unread = await prisma.notification.count({
    where: { workspaceId: membership.workspaceId, readAt: null },
  });

  return (
    <div className="min-h-screen">
      <Sidebar
        wsName={membership.workspace.name}
        plan={membership.workspace.plan}
        userEmail={user.email}
        initialUnread={unread}
      />
      <main className="p-4 lg:pl-[17.5rem] lg:pr-6 lg:pt-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
