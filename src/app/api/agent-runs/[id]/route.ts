import { prisma } from "@/lib/db";
import { withWorkspace, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withWorkspace(req, async (_req, ctx) => {
    const run = await prisma.agentRun.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
      include: { _count: { select: { leads: true, contentItems: true, documents: true } } },
    });
    if (!run) return jsonOk({ error: "Run not found" }, 404);
    return jsonOk({ run });
  });
}
