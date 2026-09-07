import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

const Brand = z.object({
  brandName: z.string().min(1).max(80).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  brandLogoUrl: z.string().url().max(500).or(z.literal("")).optional(),
});

export async function PATCH(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    requireRole(ctx, ["OWNER", "ADMIN"]);
    const { brandName, brandColor, brandLogoUrl } = await parseBody(r, Brand);
    await prisma.workspace.update({
      where: { id: ctx.workspaceId },
      data: {
        ...(brandName ? { brandName } : {}),
        ...(brandColor ? { brandColor } : {}),
        ...(brandLogoUrl !== undefined ? { brandLogoUrl: brandLogoUrl || null } : {}),
      },
    });
    return jsonOk({ ok: true });
  });
}
