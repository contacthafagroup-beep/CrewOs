import { prisma } from "./db";
import { Prisma } from "@prisma/client";

/**
 * DB-backed durable queue. Postgres is the only infra dependency, which keeps
 * the entire platform deployable on free tiers. Redis/BullMQ is the documented
 * upgrade path once a second worker process is needed (see ARCHITECTURE.md).
 */

export function workerInline(): boolean {
  return process.env.WORKER_INLINE !== "false";
}

export async function enqueueJob(
  type: string,
  payload: Prisma.InputJsonValue,
  workspaceId?: string,
): Promise<void> {
  await prisma.job.create({ data: { type, payload, workspaceId } });
}

async function claimJobs(limit: number) {
  const due = await prisma.job.findMany({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  for (const j of due) {
    await prisma.job.update({ where: { id: j.id }, data: { status: "RUNNING" } });
  }
  return due;
}

export async function processPendingJobs(limit = 5): Promise<number> {
  const jobs = await claimJobs(limit);
  let processed = 0;
  for (const j of jobs) {
    try {
      if (j.type === "agent-run") {
        // Dynamic import avoids an engine↔queue circular dependency.
        const { executeRun } = await import("./engine");
        const runId = (j.payload as { runId?: string }).runId;
        if (!runId) throw new Error("agent-run job missing runId");
        await executeRun(runId);
      } else {
        throw new Error(`Unknown job type: ${j.type}`);
      }
      await prisma.job.update({ where: { id: j.id }, data: { status: "DONE" } });
      processed++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "job failed";
      const attempts = j.attempts + 1;
      await prisma.job.update({
        where: { id: j.id },
        data: {
          attempts,
          lastError: message.slice(0, 400),
          status: attempts >= 3 ? "FAILED" : "PENDING",
          runAt: new Date(Date.now() + 60_000),
        },
      });
    }
  }
  return processed;
}
