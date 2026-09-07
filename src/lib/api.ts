import { NextResponse } from "next/server";
import { z, type ZodType, type ZodTypeDef } from "zod";
import { prisma } from "./db";
import { getSession } from "./auth/session";
import { ApiError } from "./errors";

export { ApiError };

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceCtx {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  plan: string;
  role: WorkspaceRole;
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonErr(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }
  return parsed.data;
}

/** Resolves session + workspace membership, runs the handler, maps errors to JSON responses. */
export async function withWorkspace(
  req: Request,
  fn: (req: Request, ctx: WorkspaceCtx) => Promise<Response>,
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) throw new ApiError(401, "Not signed in");
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new ApiError(401, "Account not found");
    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: session.userId, workspaceId: session.wsId } },
    });
    const ws = membership
      ? await prisma.workspace.findUnique({ where: { id: membership.workspaceId } })
      : null;
    if (!membership || !ws) throw new ApiError(401, "Workspace not found — sign in again");
    return await fn(req, {
      userId: user.id,
      userEmail: user.email,
      workspaceId: ws.id,
      workspaceName: ws.name,
      plan: ws.plan,
      role: membership.role,
    });
  } catch (e) {
    if (e instanceof ApiError) return jsonErr(e.status, e.message);
    console.error("[api] unhandled error:", e);
    return jsonErr(500, "Internal error");
  }
}

export function requireRole(ctx: WorkspaceCtx, roles: WorkspaceRole[]): void {
  if (!roles.includes(ctx.role)) throw new ApiError(403, "Insufficient permissions");
}

export const zEmail = z.string().email().max(320);
export const zPlan = z.enum(["STARTER", "GROWTH", "SCALE"]);
