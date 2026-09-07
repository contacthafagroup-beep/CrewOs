import { prisma } from "../db";
import { extractJson } from "../ai/json";
import { clampScore } from "./scoring";
import type { AgentDefinition, RunCtx } from "./types";

const SYS = `You are an elite B2B sales development expert. You find ideal-customer-fit leads and write short, specific, human cold emails that get replies. Never generic. Never spammy. Always return strict JSON when asked.`;

function normalizeLead(raw: unknown): { name: string; company: string; domain: string; score: number; reasons: string[] } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const reasons = Array.isArray(r.reasons)
    ? r.reasons.map((x) => String(x)).slice(0, 4)
    : r.reasons
      ? [String(r.reasons)]
      : [];
  return {
    name: String(r.name ?? "Unknown Contact").slice(0, 120),
    company: String(r.company ?? "Unknown Company").slice(0, 160),
    domain: String(r.domain ?? "").slice(0, 200),
    score: clampScore(r.score),
    reasons,
  };
}

export const outreachAgent: AgentDefinition = {
  id: "outreach",
  name: "Outreach Agent",
  icon: "🎯",
  tagline: "Finds leads, scores them, writes the follow-up.",
  description:
    "Give it your ideal customer profile and offer. It builds a scored lead list and drafts a 3-touch personalized email sequence for every lead, ready for your review.",
  tier: "balanced",
  inputs: [
    {
      field: "icp",
      label: "Ideal customer profile",
      type: "textarea",
      required: true,
      placeholder: "e.g. Boutique fitness studios in the US with 2-10 locations",
    },
    { field: "keywords", label: "Keywords / niche signals", type: "text", placeholder: "e.g. pilates, booking software, ClassPass" },
    { field: "offer", label: "What you offer", type: "textarea", required: true, placeholder: "e.g. Automated review-request SMS that lifts Google reviews 3x" },
    {
      field: "tone",
      label: "Tone",
      type: "select",
      options: ["Direct", "Friendly", "Formal", "Playful"],
      defaultValue: "Direct",
    },
    { field: "count", label: "Number of leads", type: "number", defaultValue: "8", help: "1–25" },
  ],
  steps: [
    { id: "leads", label: "Prospecting & scoring" },
    { id: "sequences", label: "Writing sequences" },
  ],
  async run(ctx: RunCtx, input: Record<string, string>) {
    const count = Math.max(1, Math.min(25, parseInt(input.count || "8", 10) || 8));

    ctx.step("leads", "running");
    const r1 = await ctx.ai("balanced", {
      system: SYS,
      json: true,
      maxTokens: 2500,
      prompt: [
        `TASK: GENERATE_LEADS`,
        `ICP: ${input.icp}`,
        `KEYWORDS: ${input.keywords ?? ""}`,
        `COUNT: ${count}`,
        ``,
        `Return JSON of shape {"leads":[{"name":"full name","company":"company name","domain":"company.com","score":0-100,"reasons":["why they fit"]}]}. Score 60-95, higher = better fit.`,
      ].join("\n"),
    });
    const parsed = extractJson<{ leads: unknown[] }>(r1.text);
    const drafts = (parsed?.leads ?? []).map(normalizeLead).slice(0, count);
    if (drafts.length === 0) throw new Error("Model returned no usable leads — try rephrasing the ICP");
    ctx.step("leads", "done");

    ctx.step("sequences", "running");
    const r2 = await ctx.ai("balanced", {
      system: SYS,
      json: true,
      maxTokens: 3500,
      prompt: [
        `TASK: WRITE_SEQUENCES`,
        `ICP: ${input.icp}`,
        `OFFER: ${input.offer}`,
        `TONE: ${input.tone ?? "Direct"}`,
        `SENDER_NAME: ${ctx.brandName}`,
        `LEADS_JSON: ${JSON.stringify({ leads: drafts.map((d) => ({ name: d.name, company: d.company })) })}`,
        ``,
        `For EACH lead return a 3-email sequence. Return JSON {"sequences":[{"company":"...","emails":[{"subject":"...","body":"..."}]}]}. Bodies are plain text with \\n line breaks, 60-120 words each, specific to the lead.`,
      ].join("\n"),
    });
    const seqParsed = extractJson<{ sequences: { company: string; emails: { subject: string; body: string }[] }[] }>(r2.text);
    const seqByCompany = new Map((seqParsed?.sequences ?? []).map((s) => [s.company, s.emails]));
    ctx.step("sequences", "done");

    let created = 0;
    for (const d of drafts) {
      await prisma.lead.create({
        data: {
          workspaceId: ctx.wsId,
          runId: ctx.runId,
          name: d.name,
          company: d.company,
          domain: d.domain,
          score: d.score,
          scoreReasons: d.reasons.join(" · "),
          emails: (seqByCompany.get(d.company) ?? []).slice(0, 3),
        },
      });
      created++;
    }
    return { summary: `${created} leads scored and queued with 3-touch sequences.`, leadsCreated: created };
  },
};
