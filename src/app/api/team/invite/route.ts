import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk, jsonErr, requireRole, zEmail } from "@/lib/api";
import { sendEmail, shellEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const Invite = z.object({
  email: zEmail,
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    requireRole(ctx, ["OWNER", "ADMIN"]);
      const { email, role } = await parseBody(r, Invite);

      const ws = await prisma.workspace.findUnique({ where: { id: ctx.workspaceId } });
      if (!ws) return jsonErr(404, "Workspace not found");

      let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) {
        user = await prisma.user.create({ data: { email: email.toLowerCase() } });
      }
      const membership = await prisma.membership.upsert({
        where: { userId_workspaceId: { userId: user.id, workspaceId: ws.id } },
        create: { userId: user.id, workspaceId: ws.id, role },
        update: { role },
      });

      const origin = process.env.APP_URL || new URL(r.url).origin;
      await sendEmail({
        to: email,
        subject: `You've been added to ${ws.name} on CrewOS`,
        html: shellEmail(
          `Join ${ws.name} on CrewOS`,
          `<p>${ctx.userEmail} added you as ${role.toLowerCase()}.</p><p>Sign in with this email address to accept.</p>`,
          { label: "Open CrewOS", url: `${origin}/login` },
        ),
      });
      return jsonOk({ member: { id: membership.id, email: email.toLowerCase(), role } });
  });
}
