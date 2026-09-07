import { z } from "zod";
import { prisma } from "@/lib/db";
import { withWorkspace, parseBody, jsonOk, jsonErr, requireRole, zPlan } from "@/lib/api";
import { getStripe, priceIdFor, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const Checkout = z.object({ plan: zPlan, annual: z.boolean().default(false) });

export async function POST(req: Request) {
  return withWorkspace(req, async (r, ctx) => {
    requireRole(ctx, ["OWNER", "ADMIN"]);
      if (!stripeEnabled()) {
        return jsonErr(
          501,
          "Stripe is not configured on this deployment. Set STRIPE_SECRET_KEY and the STRIPE_PRICE_* ids (see DEPLOYMENT.md).",
        );
      }
      const { plan, annual } = await parseBody(r, Checkout);
      const priceId = priceIdFor(plan, annual);
      if (!priceId) return jsonErr(501, `Stripe price for ${plan} (${annual ? "annual" : "monthly"}) is not configured.`);

      const stripe = getStripe();
      const ws = await prisma.workspace.findUnique({ where: { id: ctx.workspaceId } });
      if (!ws) return jsonErr(404, "Workspace not found");

      let customerId = ws.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          name: ws.brandName || ws.name,
          metadata: { wsId: ws.id },
        });
        customerId = customer.id;
        await prisma.workspace.update({ where: { id: ws.id }, data: { stripeCustomerId: customerId } });
      }

      const origin = process.env.APP_URL || new URL(r.url).origin;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/app/billing?checkout=success`,
        cancel_url: `${origin}/app/billing?checkout=cancel`,
        metadata: { wsId: ws.id, plan, annual: String(annual) },
        subscription_data: { metadata: { wsId: ws.id } },
      });
      return jsonOk({ url: session.url });
  });
}
