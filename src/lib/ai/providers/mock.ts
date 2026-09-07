import type { AIProvider } from "../types";

// Deterministic mock provider. Lets the whole product be exercised end-to-end
// with zero API keys. It parses the structured TASK lines the agent engine puts
// in prompts and returns plausible JSON — so runs, artifacts, metering, and
// limits all behave exactly like the real providers.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function field(prompt: string, key: string): string {
  const m = prompt.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return (m?.[1] ?? "").trim();
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const FIRST = ["Ava", "Liam", "Maya", "Noah", "Zara", "Ethan", "Lena", "Marcus", "Priya", "Jonas", "Sofia", "Derek"];
const LAST = ["Chen", "Patel", "Okafor", "Smith", "Novak", "Garcia", "Kim", "Weber", "Ali", "Brown", "Diaz", "Larsen"];
const SUFFIX = ["Labs", "Group", "Studio", "Partners", "Systems", "Collective", "Works", "HQ"];
const SIGNALS = [
  "recently expanded to a second location",
  "hiring for sales and marketing roles",
  "active on LinkedIn with weekly posts",
  "runs paid ads in the last 30 days",
  "uses complementary booking software",
  "mentioned growth plans in a recent interview",
];

function titleCaseWords(icp: string): string {
  const stop = new Set(["with", "and", "the", "for", "in", "of", "a", "an", "using", "that", "who"]);
  const words = icp
    .split(/[^a-zA-Z]+/)
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return words.length ? words.join(" ") : "Nimbus";
}

interface LeadDraft {
  name: string;
  company: string;
  domain: string;
  score: number;
  reasons: string[];
}

function genLeads(prompt: string): string {
  const icp = field(prompt, "ICP") || "growing small businesses";
  const keywords = field(prompt, "KEYWORDS");
  const count = Math.max(1, Math.min(25, parseInt(field(prompt, "COUNT") || "8", 10) || 8));
  const brand = titleCaseWords(icp + " " + keywords);
  const rng = mulberry32(hashString(prompt));
  const leads: LeadDraft[] = [];
  for (let i = 0; i < count; i++) {
    const company = `${brand} ${pick(rng, SUFFIX)}`;
    const domain = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.${pick(rng, ["com", "io", "co"])}`;
    leads.push({
      name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      company,
      domain,
      score: 55 + Math.floor(rng() * 42),
      reasons: [pick(rng, SIGNALS), pick(rng, SIGNALS)].filter((v, idx, a) => a.indexOf(v) === idx),
    });
  }
  return JSON.stringify({ leads });
}

interface SeqLead {
  name: string;
  company: string;
}

function genSequences(prompt: string): string {
  let leads: SeqLead[] = [];
  const raw = field(prompt, "LEADS_JSON");
  const parsed = raw ? (JSON.parse(raw) as { leads?: SeqLead[] } | SeqLead[]) : null;
  leads = Array.isArray(parsed) ? parsed : (parsed?.leads ?? []);
  const icp = field(prompt, "ICP") || "your market";
  const offer = field(prompt, "OFFER") || "our service";
  const tone = field(prompt, "TONE") || "Direct";
  const sender = field(prompt, "SENDER_NAME") || "the CrewOS team";

  const sequences = leads.map((l) => {
    const first = (l.name || "there").split(" ")[0];
    return {
      company: l.company,
      emails: [
        {
          subject: `Quick idea for ${l.company}`,
          body: `Hi ${first},\n\nI noticed ${l.company} fits the profile of ${icp} — usually that means ${offer} is worth 10 minutes of your time.\n\nWe help teams like yours cut the busywork that eats your week. Worth a quick look?\n\nBest,\n${sender}`,
        },
        {
          subject: `Re: Quick idea for ${l.company}`,
          body: `Hi ${first},\n\nFollowing up with one concrete example: a ${icp} team used ${offer} and got ~8 hours/week back within the first month.\n\nIf it resonates, I can send a 1-page summary — just reply "send it".\n\nBest,\n${sender}`,
        },
        {
          subject: `Closing the loop, ${first}`,
          body: `Hi ${first},\n\nLast note from me — if ${offer} isn't a priority this quarter, no worries at all. I'll stop reaching out and leave the door open.\n\nBest,\n${sender}`,
        },
      ],
      tone,
    };
  });
  return JSON.stringify({ sequences });
}

function genContent(prompt: string): string {
  const topic = field(prompt, "TOPIC") || "AI automation for small teams";
  const angle = field(prompt, "ANGLE") || "practical, results-first";
  const audience = field(prompt, "AUDIENCE") || "founders and operators";
  const rng = mulberry32(hashString(prompt));
  const stat = 20 + Math.floor(rng() * 15);
  const linkedin = `${topic} is not a trend — it's a cost line.\n\nMost ${audience} I talk to are drowning in repetitive work: prospecting, follow-ups, content, proposals.\n\nHere's what changes when you automate the boring ${stat}% first:\n\n→ Outreach goes out every day, not when someone remembers\n→ Proposals ship in minutes with your branding\n→ The team works on closing, not typing\n\nThe teams doing this aren't smarter. They just stopped doing $12/hour work with $120/hour people.\n\nWhat's the most repetitive task in your week? I'll tell you how I'd automate it.`;
  const thread = [
    `1/ ${topic} — the practical version, no hype.`,
    `2/ Step 1: write down every task you repeat weekly. Most ${audience} find 8-12. That list is your AI hiring plan.`,
    `3/ Step 2: rank by (hours saved × hourly cost). Automate the top 3 first. That's the ${angle} approach.`,
    `4/ Step 3: measure. If a task costs >$500/month in human time, an AI worker pays for itself in week one.`,
    `5/ The teams winning with AI aren't using it for everything. They're using it for the boring ${stat}% that never stops. Start there.`,
  ];
  const outline = [
    `# ${topic}: The ${angle} Guide for ${audience}`,
    "",
    "## 1. The cost of repetitive work",
    "- Where hours actually go (with a simple audit exercise)",
    "- The hidden price of context-switching",
    "",
    "## 2. What to automate first",
    "- A scoring rubric: volume × wage × error cost",
    "- Three case patterns that pay back in week one",
    "",
    "## 3. How to roll out without chaos",
    "- Human-in-the-loop approval queues",
    "- Measuring saved hours honestly",
    "",
    "## 4. The 30-day plan",
    "- Week-by-week checklist",
    "- Common failure modes and fixes",
  ].join("\n");
  return JSON.stringify({ linkedin, thread, blogOutline: outline });
}

function genProposal(prompt: string): string {
  const client = field(prompt, "CLIENT") || "the client";
  const brief = field(prompt, "BRIEF") || "a growth engagement";
  const scopeRaw = field(prompt, "SCOPE") || "Discovery\nImplementation\nOptimization";
  const scopeItems = scopeRaw.split("\n").map((s) => s.trim()).filter(Boolean);
  const lines = [
    { description: "Discovery & audit (week 1)", amountCents: 350000 },
    { description: "Implementation & setup (weeks 2-3)", amountCents: 750000 },
    { description: "Optimization & handoff (week 4)", amountCents: 400000 },
  ];
  return JSON.stringify({
    summary: `${client} engaged us for ${brief}. This proposal covers a focused four-week engagement: audit, implementation of the highest-ROI automations, and a measurable handoff so results compound after we leave.`,
    scopeItems,
    pricingLines: lines,
    terms: [
      "50% deposit due on signature, 50% on delivery.",
      "Two rounds of revisions included per deliverable.",
      "Either party may cancel with 7 days written notice; work completed is billable.",
      "Rates valid for 30 days from proposal date.",
    ],
  });
}

export const mockProvider: AIProvider = {
  id: "mock",
  async generate({ model, prompt, json }) {
    const task = field(prompt, "TASK");
    let text: string;
    if (task === "GENERATE_LEADS") text = genLeads(prompt);
    else if (task === "WRITE_SEQUENCES") text = genSequences(prompt);
    else if (task === "WRITE_CONTENT") text = genContent(prompt);
    else if (task === "WRITE_PROPOSAL") text = genProposal(prompt);
    else if (json) text = JSON.stringify({ result: "Mock response: no structured task matched." });
    else
      text =
        "Mock response (no AI provider configured). Add OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or OLLAMA_BASE_URL for real generation — see .env.example.";
    const tokensIn = Math.ceil(prompt.length / 4);
    const tokensOut = Math.ceil(text.length / 4);
    return { text, tokensIn, tokensOut, model: model || "crewos-mock-v1" };
  },
};
