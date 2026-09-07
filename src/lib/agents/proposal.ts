import { prisma } from "../db";
import { extractJson } from "../ai/json";
import { proposalHtml, totalCents, type PricingLine, type ProposalData } from "../documents";
import type { AgentDefinition, RunCtx } from "./types";

const SYS = `You are a senior consultant who writes crisp, persuasive client proposals. Specific scope, honest pricing structure, clear terms. Always return strict JSON when asked.`;

function normalizeLines(raw: unknown): PricingLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const r = (l ?? {}) as Record<string, unknown>;
      return {
        description: String(r.description ?? "Line item").slice(0, 200),
        amountCents: Math.max(0, Math.round(Number(r.amountCents) || 0)),
      };
    })
    .filter((l) => l.description.length > 0)
    .slice(0, 12);
}

export const proposalAgent: AgentDefinition = {
  id: "proposal",
  name: "Proposal Agent",
  icon: "📄",
  tagline: "Branded proposals and quotes in minutes.",
  description:
    "Turn a client brief into a polished, branded proposal with scope, pricing lines, and terms — rendered as a printable document.",
  tier: "premium",
  inputs: [
    { field: "clientName", label: "Client name", type: "text", required: true, placeholder: "e.g. Brightsmile Dental Group" },
    { field: "brief", label: "Project brief", type: "textarea", required: true, placeholder: "What does the client need and why now?" },
    { field: "scope", label: "Scope notes (one item per line)", type: "textarea", placeholder: "Discovery workshop\nImplementation\nHandoff & training" },
    { field: "budgetNotes", label: "Budget / pricing hints", type: "text", placeholder: "e.g. around $15k, milestone-based" },
    { field: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP"], defaultValue: "USD" },
  ],
  steps: [
    { id: "draft", label: "Drafting proposal" },
    { id: "render", label: "Branding & rendering" },
  ],
  async run(ctx: RunCtx, input: Record<string, string>) {
    ctx.step("draft", "running");
    const r = await ctx.ai("premium", {
      system: SYS,
      json: true,
      maxTokens: 2500,
      prompt: [
        `TASK: WRITE_PROPOSAL`,
        `CLIENT: ${input.clientName}`,
        `BRIEF: ${input.brief}`,
        `SCOPE: ${input.scope ?? ""}`,
        `BUDGET: ${input.budgetNotes ?? ""}`,
        `CURRENCY: ${input.currency ?? "USD"}`,
        ``,
        `Return JSON {"summary":"2-3 sentence engagement summary","scopeItems":["..."],"pricingLines":[{"description":"...","amountCents":123456}],"terms":["..."]}. amounts are integer CENTS. Match budget hints when given; otherwise propose 3 milestone lines.`,
      ].join("\n"),
    });
    const parsed = extractJson<Partial<ProposalData>>(r.text);
    const lines = normalizeLines(parsed?.pricingLines);
    if (lines.length === 0) throw new Error("Model returned no pricing lines");
    const data: ProposalData = {
      summary: String(parsed?.summary ?? "Custom engagement."),
      scopeItems: (parsed?.scopeItems ?? []).map((s) => String(s)).slice(0, 12),
      pricingLines: lines,
      terms: (parsed?.terms ?? []).map((t) => String(t)).slice(0, 8),
      totalCents: totalCents(lines),
    };
    ctx.step("draft", "done");

    ctx.step("render", "running");
    const ws = await prisma.workspace.findUnique({ where: { id: ctx.wsId }, select: { brandName: true, brandColor: true, brandLogoUrl: true } });
    const html = proposalHtml(
      { name: ws?.brandName || ctx.brandName, color: ws?.brandColor || "#10b981", logoUrl: ws?.brandLogoUrl ?? null },
      data,
      input.clientName,
      input.currency || "USD",
    );
    const doc = await prisma.document.create({
      data: {
        workspaceId: ctx.wsId,
        runId: ctx.runId,
        type: "PROPOSAL",
        title: `Proposal — ${input.clientName}`,
        data: { ...data, clientName: input.clientName, currency: input.currency || "USD" } as object,
        html,
      },
    });
    ctx.step("render", "done");
    return { summary: `Proposal ready — total ${(data.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: input.currency || "USD", maximumFractionDigits: 0 })}.`, documentId: doc.id };
  },
};
