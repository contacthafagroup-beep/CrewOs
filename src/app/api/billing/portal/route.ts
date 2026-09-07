import { prisma } from "@/lib/db";
import { withWorkspace, jsonOk, jsonErr, requireRole } from "@/lib/api";
import { getStripe, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    try {
      requireRole(ctx, ["OWNER", "ADMIN"]);
      if (!stripeEnabled()) return jsonErr(501, "Stripe is not configured on this deployment.");
      const ws = await prisma.workspace.findUnique({ where: { id: ctx.workspaceId } });
      if (!ws?.stripeCustomerId) {
        return jsonErr(400, "No billing profile yet — subscribe to a plan first.");
      }
      const origin = process.env.APP_URL || new URL(r.url).origin;
      const stripe = getStripe();
      const portal = await stripe.billingPortal.sessions.create({
        customer: ws.stripeCustomerId,
        return_url: `${origin}/app/billing`,
      });
      return jsonOk({ url: portal.url });
    } catch (e) {
      console.error("[billing/portal]", e);
      return jsonErr(500, "Could not open billing portal");
    }
  });
}
