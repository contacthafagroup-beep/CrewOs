import { prisma } from "../db";
import { extractJson } from "../ai/json";
import type { AgentDefinition, RunCtx } from "./types";

const SYS = `You are a senior content marketer for B2B SaaS. You write scroll-stopping, specific, no-fluff content that sounds human. Always return strict JSON when asked.`;

export const contentAgent: AgentDefinition = {
  id: "content",
  name: "Content Agent",
  icon: "✍️",
  tagline: "LinkedIn, X threads, and blog outlines on tap.",
  description:
    "Give it a topic and angle. It drafts a LinkedIn post, an X thread, and a blog outline — all queued for your approval before anything ships.",
  tier: "balanced",
  inputs: [
    { field: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. Why agencies lose money on manual reporting" },
    { field: "angle", label: "Angle / hot take", type: "text", placeholder: "e.g. Reporting should sell the retainer, not document it" },
    { field: "audience", label: "Audience", type: "text", defaultValue: "agency founders and operators" },
  ],
  steps: [{ id: "draft", label: "Drafting content" }],
  async run(ctx: RunCtx, input: Record<string, string>) {
    ctx.step("draft", "running");
    const r = await ctx.ai("balanced", {
      system: SYS,
      json: true,
      maxTokens: 2500,
      prompt: [
        `TASK: WRITE_CONTENT`,
        `TOPIC: ${input.topic}`,
        `ANGLE: ${input.angle ?? "practical, results-first"}`,
        `AUDIENCE: ${input.audience ?? "founders and operators"}`,
        ``,
        `Return JSON {"linkedin":"post text","thread":["tweet 1","tweet 2", ... 5-7],"blogOutline":"markdown outline"}. LinkedIn 100-160 words with line breaks (\\n\\n), strong hook first line.`,
      ].join("\n"),
    });
    const parsed = extractJson<{ linkedin?: string; thread?: string[]; blogOutline?: string }>(r.text);
    const linkedin = parsed?.linkedin?.trim();
    const thread = (parsed?.thread ?? []).map((t) => String(t)).filter(Boolean);
    const outline = parsed?.blogOutline?.trim();
    if (!linkedin && thread.length === 0 && !outline) throw new Error("Model returned no usable content");

    if (linkedin) {
      await prisma.contentItem.create({
        data: { workspaceId: ctx.wsId, runId: ctx.runId, type: "LINKEDIN", title: input.topic, body: linkedin },
      });
    }
    if (thread.length > 0) {
      await prisma.contentItem.create({
        data: { workspaceId: ctx.wsId, runId: ctx.runId, type: "X_THREAD", title: input.topic, body: thread.join("\n\n—\n\n") },
      });
    }
    if (outline) {
      await prisma.contentItem.create({
        data: { workspaceId: ctx.wsId, runId: ctx.runId, type: "BLOG_OUTLINE", title: input.topic, body: outline },
      });
    }
    ctx.step("draft", "done");
    return { summary: "Drafts ready for approval in your content queue." };
  },
};
