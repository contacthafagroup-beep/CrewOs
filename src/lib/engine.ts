import { prisma } from "./db";
import { ApiError } from "./errors";
import { planFor, usageWarned } from "./plans";
import { monthStartUtc } from "./usage";
import { generate, modelForTier, activeProviderId } from "./ai/router";
import { estCostCents } from "./ai/pricing";
import { agentById } from "./agents/registry";
import type { AgentDefinition, RunCtx, StepStatus } from "./agents/types";
import { notify } from "./notifications";
import { enqueueJob, workerInline } from "./queue";

export function validateAgentInput(
  def: AgentDefinition,
  input: Record<string, unknown>,
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const spec of def.inputs) {
    const raw = input[spec.field];
    const value = raw === undefined || raw === null ? "" : String(raw).trim();
    if (spec.required && !value) {
      throw new ApiError(400, `Missing required field: ${spec.label}`);
    }
    clean[spec.field] = value || spec.defaultValue || "";
  }
  return clean;
}

/** Creates a run (enforcing plan limits) and executes it inline or via queue. */
export async function startAgentRun(
  workspaceId: string,
  userId: string,
  agentId: string,
  input: Record<string, unknown>,
) {
  const def = agentById(agentId);
  if (!def) throw new ApiError(404, `Unknown agent: ${agentId}`);

  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) throw new ApiError(404, "Workspace not found");

  const plan = planFor(ws.plan);
  const monthStart = monthStartUtc();
  const used = await prisma.agentRun.count({
    where: { workspaceId, createdAt: { gte: monthStart } },
  });
  if (used >= plan.runLimit) {
    throw new ApiError(
      402,
      `Monthly run limit reached (${plan.runLimit}/${plan.runLimit}). Upgrade your plan to keep your AI crew working.`,
    );
  }
  if (usageWarned(ws.plan, used + 1)) {
    await notify(workspaceId, "Plan usage alert", `${used + 1}/${plan.runLimit} runs used this month. Consider upgrading.`);
  }

  const clean = validateAgentInput(def, input);
  const run = await prisma.agentRun.create({
    data: { workspaceId, userId, agent: agentId, status: "QUEUED", input: clean as object },
  });

  if (workerInline()) {
    return executeRun(run.id);
  }
  await enqueueJob("agent-run", { runId: run.id }, workspaceId);
  return run;
}

/** Executes a run to completion, metering every AI call. Idempotent for finished runs. */
export async function executeRun(runId: string) {
  const run = await prisma.agentRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`Run not found: ${runId}`);
  if (run.status === "COMPLETED") return run;

  const def = agentById(run.agent);
  const ws = await prisma.workspace.findUnique({
    where: { id: run.workspaceId },
    select: { brandName: true, plan: true },
  });

  const steps = (def?.steps ?? []).map((s) => ({ ...s, status: "pending" as StepStatus }));
  let tokensIn = 0;
  let tokensOut = 0;
  let costCents = 0;
  let lastModel = "";

  const persistOutput = async (current: string | null, result?: unknown) => {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        output: { steps, current, ...(result !== undefined ? { result } : {}) } as object,
        tokensIn,
        tokensOut,
        estCostCents: costCents,
        model: lastModel || null,
      },
    });
  };

  const ctx: RunCtx = {
    runId: run.id,
    wsId: run.workspaceId,
    userId: run.userId ?? undefined,
    brandName: ws?.brandName ?? "CrewOS",
    step: async (id, status) => {
      const s = steps.find((x) => x.id === id);
      if (s) s.status = status;
      await persistOutput(id);
    },
    ai: async (tier, opts) => {
      const model = modelForTier(tier, activeProviderId());
      const r = await generate({ ...opts, tier });
      lastModel = r.model;
      tokensIn += r.tokensIn;
      tokensOut += r.tokensOut;
      const c = estCostCents(r.model, r.tokensIn, r.tokensOut);
      costCents += c;
      await prisma.usageEvent.create({
        data: {
          workspaceId: run.workspaceId,
          userId: run.userId,
          runId: run.id,
          agent: run.agent,
          model: r.model,
          tokensIn: r.tokensIn,
          tokensOut: r.tokensOut,
          estCostCents: c,
        },
      });
      return r;
    },
  };

  await prisma.agentRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });

  try {
    if (!def) throw new Error(`Unknown agent: ${run.agent}`);
    const input = (run.input as Record<string, string>) ?? {};
    const result = await def.run(ctx, input);
    for (const s of steps) s.status = "done";
    await persistOutput(null, result);
    const completed = await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await notify(run.workspaceId, `${def.name} finished`, result.summary, run.userId ?? undefined);
    return completed;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    console.error(`[run:${run.id}] failed:`, message);
    const failed = await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message.slice(0, 500), completedAt: new Date() },
    });
    await notify(run.workspaceId, `${def?.name ?? "Agent"} run failed`, message.slice(0, 300), run.userId ?? undefined);
    return failed;
  }
}
