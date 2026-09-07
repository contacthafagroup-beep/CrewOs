import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

const PatchLead = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "REPLIED", "WON", "LOST"]),
});

export async function GET(req: Request) {
  return withWorkspace(req, async (_req, ctx) => {
    const leads = await prisma.lead.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return jsonOk({ leads });
  });
}

export async function PATCH(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    const { id, status } = await parseBody(r, PatchLead);
    const lead = await prisma.lead.updateMany({
      where: { id, workspaceId: ctx.workspaceId },
      data: { status },
    });
    return jsonOk({ updated: lead.count });
  });
}
