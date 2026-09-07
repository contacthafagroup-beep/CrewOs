// Quick DB + config health check. Run: npx tsx scripts/db-check.ts
import { PrismaClient } from "@prisma/client";
import { activeProviderId, modelForTier } from "../src/lib/ai/router";
import { stripeEnabled, priceIdFor } from "../src/lib/stripe";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const workspaces = await prisma.workspace.findMany({
    select: {
      name: true,
      slug: true,
      plan: true,
      _count: { select: { leads: true, runs: true, contentItems: true, documents: true, notifications: true } },
    },
  });
  console.log("✓ DB reachable");
  for (const ws of workspaces) {
    console.log(
      `  ${ws.name} (${ws.slug}) plan=${ws.plan} leads=${ws._count.leads} runs=${ws._count.runs} content=${ws._count.contentItems} docs=${ws._count.documents} notifs=${ws._count.notifications}`,
    );
  }
  console.log("users:", await prisma.user.count());

  console.log("AI provider:", activeProviderId(), "| premium tier →", modelForTier("premium", activeProviderId()));
  console.log("Stripe:", stripeEnabled() ? "configured" : "NOT configured");
  const missing = (["STARTER", "GROWTH", "SCALE"] as const).flatMap((t) =>
    (["MONTHLY", "ANNUAL"] as const)
      .filter((k) => !priceIdFor(t, k === "ANNUAL"))
      .map((k) => `${t}_${k}`),
  );
  console.log("Stripe prices:", missing.length === 0 ? "all 6 present" : `MISSING: ${missing.join(", ")}`);
}

main()
  .catch((e) => {
    console.error("DB_ERROR:", e instanceof Error ? e.message.slice(0, 300) : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
