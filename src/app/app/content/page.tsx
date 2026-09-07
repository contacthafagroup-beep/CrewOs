import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ContentQueue, type ContentDTO } from "@/components/content-queue";
import { EmptyState, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await prisma.contentItem.findMany({
    where: { workspaceId: session.wsId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const items: ContentDTO[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Content queue</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Drafts from your Content Agent. Nothing ships until you approve it.</p>
        </div>
        <Link href="/app/agents/content">
          <Button>✍️ Run Content Agent</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="✍️" title="Queue is empty" body="Run the Content Agent with a topic — LinkedIn posts, X threads, and blog outlines arrive as drafts." />
      ) : (
        <ContentQueue initialItems={items} />
      )}
    </div>
  );
}
