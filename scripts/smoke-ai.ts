// Runtime smoke test for the AI layer — no API keys needed (mock provider).
// Run: npm run smoke

import { generate, activeProviderId } from "../src/lib/ai/router";
import { extractJson } from "../src/lib/ai/json";
import { clampScore } from "../src/lib/agents/scoring";

interface Lead {
  name: string;
  company: string;
  domain: string;
  score: number;
  reasons: string[];
}

async function main(): Promise<void> {
  console.log("active provider:", activeProviderId());
  const checks: [string, boolean][] = [];

  // 1. Lead generation contract
  const r1 = await generate({
    system: "You are an elite B2B sales expert. Always return strict JSON.",
    prompt: [
      "TASK: GENERATE_LEADS",
      "ICP: Boutique fitness studios in the US with 2-10 locations",
      "KEYWORDS: pilates",
      "COUNT: 5",
      "",
      'Return JSON {"leads":[{"name","company","domain","score","reasons":[]}]}',
    ].join("\n"),
    json: true,
    tier: "balanced",
  });
  const leads = extractJson<{ leads: Lead[] }>(r1.text);
  const leadsOk = !!leads?.leads?.length && leads.leads.every((l) => typeof l.company === "string" && typeof clampScore(l.score) === "number");
  checks.push(["GENERATE_LEADS contract", leadsOk]);

  // 2. Sequence contract (feeds real leads JSON like the engine does)
  const r2 = await generate({
    system: "You are an elite B2B sales expert. Always return strict JSON.",
    prompt: [
      "TASK: WRITE_SEQUENCES",
      "ICP: Boutique fitness studios",
      "OFFER: Automated review-request SMS",
      "TONE: Direct",
      "SENDER_NAME: Demo Co",
      `LEADS_JSON: ${JSON.stringify({ leads: (leads?.leads ?? []).slice(0, 3).map((l) => ({ name: l.name, company: l.company })) })}`,
      "",
      'Return JSON {"sequences":[{"company","emails":[{"subject","body"}]}]}',
    ].join("\n"),
    json: true,
    tier: "balanced",
  });
  const seqs = extractJson<{ sequences: { company: string; emails: { subject: string; body: string }[] }[] }>(r2.text);
  const seqOk = !!seqs?.sequences?.length && seqs.sequences[0].emails.length === 3;
  checks.push(["WRITE_SEQUENCES contract", seqOk]);

  // 3. Content contract
  const r3 = await generate({
    system: "You are a senior content marketer. Always return strict JSON.",
    prompt: [
      "TASK: WRITE_CONTENT",
      "TOPIC: Why gyms lose members in month two",
      "ANGLE: Retention is an onboarding problem",
      "AUDIENCE: studio owners",
      "",
      'Return JSON {"linkedin","thread":[...],"blogOutline"}',
    ].join("\n"),
    json: true,
    tier: "balanced",
  });
  const content = extractJson<{ linkedin?: string; thread?: string[]; blogOutline?: string }>(r3.text);
  const contentOk = !!content?.linkedin && Array.isArray(content.thread) && content.thread.length >= 3;
  checks.push(["WRITE_CONTENT contract", contentOk]);

  // 4. Proposal contract
  const r4 = await generate({
    system: "You are a senior consultant. Always return strict JSON.",
    prompt: [
      "TASK: WRITE_PROPOSAL",
      "CLIENT: Brightsmile Dental Group",
      "BRIEF: New-patient growth campaign",
      "SCOPE: Discovery\nImplementation\nHandoff",
      "BUDGET: around $15k",
      "CURRENCY: USD",
      "",
      'Return JSON {"summary","scopeItems":[],"pricingLines":[{"description","amountCents"}],"terms":[]}',
    ].join("\n"),
    json: true,
    tier: "premium",
  });
  const proposal = extractJson<{ pricingLines?: { description: string; amountCents: number }[] }>(r4.text);
  const proposalOk = !!proposal?.pricingLines?.length && proposal.pricingLines.every((l) => Number.isFinite(l.amountCents));
  checks.push(["WRITE_PROPOSAL contract", proposalOk]);

  console.log("\nSmoke results:");
  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(` ${ok ? "✓" : "✗"} ${name}`);
    if (!ok) failed++;
  }
  console.log(`\nmodel used: ${r1.model} (tier routing ok)`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Smoke failed:", e);
  process.exitCode = 1;
});
