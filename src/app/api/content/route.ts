import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

const PatchContent = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "APPROVED", "REJECTED"]).optional(),
  body: z.string().max(20_000).optional(),
});

export async function GET(req: Request) {
  return withWorkspace(req, async (_req, ctx) => {
    const items = await prisma.contentItem.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ items });
  });
}

export async function PATCH(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    const { id, status, body } = await parseBody(r, PatchContent);
    const item = await prisma.contentItem.updateMany({
      where: { id, workspaceId: ctx.workspaceId },
      data: {
        ...(status ? { status } : {}),
        ...(body !== undefined ? { body } : {}),
        updatedAt: new Date(),
      },
    });
    return jsonOk({ updated: item.count });
  });
}
