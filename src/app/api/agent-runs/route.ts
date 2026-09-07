import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk, jsonErr } from "@/lib/api";
import { startAgentRun } from "@/lib/engine";
import { aiRunLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CreateRun = z.object({
  agentId: z.string().min(1).max(64),
  input: z.record(z.unknown()),
});

export async function GET(req: Request) {
  return withWorkspace(req, async (_req, ctx) => {
    const runs = await prisma.agentRun.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({ runs });
  });
}

export async function POST(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    if (!aiRunLimiter(ctx.workspaceId)) return jsonErr(429, "Slow down — max 10 agent runs per minute");
    const body = await parseBody(r, CreateRun);
    const run = await startAgentRun(ctx.workspaceId, ctx.userId, body.agentId, body.input);
    return jsonOk({ run });
  });
}
