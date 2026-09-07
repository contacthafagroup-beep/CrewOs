import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/api";
import { getStripe, mapStripeStatus, planFromPriceId } from "@/lib/stripe";
import { applyReferralCredit } from "@/lib/referrals";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Raw body + signature verification.
 * Configure endpoint → https://yourdomain.com/api/webhooks/stripe
 * Events: checkout.session.completed, customer.subscription.updated,
 *         customer.subscription.deleted
 */

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return new Response("Stripe webhooks not configured", { status: 501 });
  }
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed:", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.metadata?.wsId) break;
        const wsId = session.metadata.wsId;
        const ws = await prisma.workspace.findUnique({ where: { id: wsId } });
        if (!ws) break;

        const subId = session.subscription as string | null;
        const sub = subId ? await getStripe().subscriptions.retrieve(subId) : null;
        const priceId = sub?.items.data[0]?.price?.id ?? "";
        const metaPlan = session.metadata.plan as "STARTER" | "GROWTH" | "SCALE" | undefined;
        const plan =
          metaPlan && ["STARTER", "GROWTH", "SCALE"].includes(metaPlan)
            ? metaPlan
            : planFromPriceId(priceId) ?? "STARTER";

        const existing = await prisma.subscription.findUnique({ where: { workspaceId: wsId } });
        const values = {
          workspaceId: wsId,
          stripeSubscriptionId: sub?.id ?? `session_${session.id}`,
          stripeCustomerId: (session.customer as string) ?? ws.stripeCustomerId ?? "",
          plan,
          status: mapStripeStatus(sub?.status ?? "active"),
          priceId: priceId || null,
          annual: session.metadata.annual === "true",
          currentPeriodEnd: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        };
        await prisma.subscription.upsert({
          where: { workspaceId: wsId },
          create: values,
          update: values,
        });
        await prisma.workspace.update({
          where: { id: wsId },
          data: { plan, stripeCustomerId: values.stripeCustomerId },
        });

        // First paid subscription → referral credit for the referrer.
        if (!existing) {
          const ownerMembership = await prisma.membership.findFirst({
            where: { workspaceId: wsId, role: "OWNER" },
            include: { user: true },
          });
          const refCode = ownerMembership?.user.referredByCode;
          if (refCode) {
            const referrer = await prisma.workspace.findUnique({ where: { referralCode: refCode } });
            if (referrer && referrer.id !== wsId) {
              await applyReferralCredit(referrer.id, wsId, `Paid referral — ${ws.name}`);
              await notify(referrer.id, "Referral credit earned 💸", "$100 credit added — a referred workspace just subscribed.");
            }
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const row = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
          include: { workspace: true },
        });
        if (!row) break;
        const priceId = sub.items.data[0]?.price?.id ?? "";
        const status = mapStripeStatus(sub.status);
        await prisma.subscription.update({
          where: { id: row.id },
          data: {
            status,
            plan: planFromPriceId(priceId) ?? row.plan,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const row = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
          include: { workspace: true },
        });
        if (!row) break;
        await prisma.subscription.update({ where: { id: row.id }, data: { status: "CANCELED" } });
        await prisma.workspace.update({ where: { id: row.workspaceId }, data: { plan: "STARTER" } });
        await notify(row.workspaceId, "Subscription canceled", "Your workspace has been moved to the Starter plan.");
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error:", e);
    return new Response("Webhook handler error", { status: 500 });
  }

  return jsonOk({ received: true });
}
