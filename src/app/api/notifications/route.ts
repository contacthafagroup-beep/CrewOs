import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

const MarkRead = z.object({
  ids: z.array(z.string()).max(100).optional(),
  all: z.boolean().optional(),
});

export async function GET(req: Request) {
  return withWorkspace(req, async (_req, ctx) => {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { workspaceId: ctx.workspaceId, readAt: null } }),
    ]);
    return jsonOk({ items, unread });
  });
}

export async function POST(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    const { ids, all } = await parseBody(r, MarkRead);
    await prisma.notification.updateMany({
      where: {
        workspaceId: ctx.workspaceId,
        readAt: null,
        ...(all ? {} : { id: { in: ids ?? [] } }),
      },
      data: { readAt: new Date() },
    });
    return jsonOk({ ok: true });
  });
}
