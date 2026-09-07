import { ensureDemoData } from "../src/lib/demo-data";
import { prisma } from "../src/lib/db";

ensureDemoData()
  .then(({ userId, wsId }) => {
    console.log("✓ Demo workspace ready");
    console.log("  user:", userId);
    console.log("  workspace:", wsId);
    console.log("  sign in with the demo button on /login (DEMO_MODE=true)");
  })
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
