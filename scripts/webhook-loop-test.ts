// Stripe webhook loop test — simulates exactly what the Stripe CLI does:
// builds a real event payload, signs it with STRIPE_WEBHOOK_SECRET (Stripe's
// v1 scheme: t=timestamp,v1=HMAC-SHA256(signed_payload)), and POSTs it to the
// running app. Then verifies the DB flipped the workspace plan.
// Run: node --env-file=.env --import tsx scripts/webhook-loop-test.ts

import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const GROWTH_MONTHLY = process.env.STRIPE_PRICE_GROWTH_MONTHLY || "";

function stripeSign(payload: string, secret: string): { header: string; t: string } {
  const t = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${t}.${payload}`;
  const v1 = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return { header: `t=${t},v1=${v1}`, t };
}

async function main(): Promise<void> {
  if (!WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  if (!GROWTH_MONTHLY) throw new Error("STRIPE_PRICE_GROWTH_MONTHLY missing");

  const ws = await prisma.workspace.findFirst({ where: { slug: "demo-co" } });
  if (!ws) throw new Error("demo workspace not found — run npm run seed");
  console.log(`workspace: ${ws.name} plan=${ws.plan} id=${ws.id}`);
  const planBefore = ws.plan;

  // 1. Create REAL test-mode Stripe objects: customer + active subscription.
  //    (checkout.session.completed handler retrieves the subscription server-side,
  //     so a fabricated sub id would 404 — the event must reference real objects.)
  const sk = process.env.STRIPE_SECRET_KEY || "";
  if (!sk) throw new Error("STRIPE_SECRET_KEY missing");
  const auth = { Authorization: `Bearer ${sk}`, "content-type": "application/x-www-form-urlencoded" };
  const form = (data: Record<string, string>) => new URLSearchParams(data).toString();

  const cust = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST", headers: auth,
    body: form({ name: "CrewOS Loop Test", "metadata[wsId]": ws.id }),
  }).then(async (r) => {
    const j = await r.json();
    if (!r.ok) throw new Error(`customer create failed: ${JSON.stringify(j).slice(0, 200)}`);
    return j as { id: string };
  });
  console.log(`stripe customer: ${cust.id}`);

  // Real test-mode payment method (tok_visa) → attach → active subscription.
  const pm = await fetch("https://api.stripe.com/v1/payment_methods", {
    method: "POST", headers: auth,
    body: form({ type: "card", "card[token]": "tok_visa" }),
  }).then(async (r) => {
    const j = await r.json();
    if (!r.ok) throw new Error(`payment_method create failed: ${JSON.stringify(j).slice(0, 200)}`);
    return j as { id: string };
  });
  await fetch(`https://api.stripe.com/v1/payment_methods/${pm.id}/attach`, {
    method: "POST", headers: auth, body: form({ customer: cust.id }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`pm attach failed: ${(await r.text()).slice(0, 200)}`);
  });
  console.log(`stripe payment method: ${pm.id} (attached)`);

  const stripeSub = await fetch("https://api.stripe.com/v1/subscriptions", {
    method: "POST", headers: auth,
    body: form({
      customer: cust.id,
      "items[0][price]": GROWTH_MONTHLY,
      default_payment_method: pm.id,
      "metadata[wsId]": ws.id,
    }),
  }).then(async (r) => {
    const j = await r.json();
    if (!r.ok) throw new Error(`subscription create failed: ${JSON.stringify(j).slice(0, 200)}`);
    return j as { id: string; status: string; current_period_end: number };
  });
  console.log(`stripe subscription: ${stripeSub.id} status=${stripeSub.status}`);
  if (stripeSub.status !== "active") throw new Error(`expected active subscription, got ${stripeSub.status}`);

  const subId = stripeSub.id;
  const customerId = cust.id;
  const event = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        mode: "subscription",
        customer: customerId,
        subscription: subId,
        metadata: { wsId: ws.id, plan: "GROWTH", annual: "false" },
      },
    },
  };
  const payload = JSON.stringify(event);
  const { header } = stripeSign(payload, WEBHOOK_SECRET);

  console.log(`POST ${APP_URL}/api/webhooks/stripe (checkout.session.completed, signed)`);
  const res = await fetch(`${APP_URL}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": header },
    body: payload,
  });
  const body = await res.text();
  console.log(`webhook responded HTTP ${res.status}: ${body.slice(0, 120)}`);
  if (res.status !== 200) throw new Error("webhook did not accept the event");

  // Verify DB effects: subscription row + workspace plan flip
  const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
  const after = await prisma.workspace.findUnique({ where: { id: ws.id } });
  console.log(`subscription row: ${sub ? `plan=${sub.plan} status=${sub.status} annual=${sub.annual}` : "MISSING"}`);
  console.log(`workspace plan: ${planBefore} -> ${after?.plan}`);
  if (!sub || sub.plan !== "GROWTH" || sub.status !== "ACTIVE" || after?.plan !== "GROWTH") {
    throw new Error("DB did not reflect the webhook event");
  }

  // Cleanup: remove test rows, restore prior plan, delete real test-mode Stripe objects
  await prisma.subscription.delete({ where: { id: sub.id } }).catch(() => {});
  await prisma.workspace.update({ where: { id: ws.id }, data: { plan: planBefore } });
  await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    method: "DELETE", headers: auth, body: form({}),
  });
  await fetch(`https://api.stripe.com/v1/customers/${customerId}`, { method: "DELETE", headers: auth });
}

main()
  .catch((e) => {
    console.error("LOOP TEST FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
