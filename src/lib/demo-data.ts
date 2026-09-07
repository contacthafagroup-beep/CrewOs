import { prisma } from "./db";
import { proposalHtml, totalCents } from "./documents";

/**
 * Demo data used by BOTH the seed script (`npm run seed`) and the zero-key
 * demo login (`POST /api/auth/demo`). Idempotent: creates only when missing.
 */

export const DEMO_EMAIL = "demo@crewos.app";
export const DEMO_SLUG = "demo-co";

async function seedDemoContent(wsId: string, userId: string): Promise<void> {
  const now = Date.now();

  const runData = [
    {
      agent: "outreach",
      input: { icp: "Boutique fitness studios in the US with 2-10 locations", offer: "Automated review-request SMS", tone: "Direct", count: "8" },
      output: { steps: [{ id: "leads", label: "Prospecting & scoring", status: "done" }, { id: "sequences", label: "Writing sequences", status: "done" }], current: null, result: { summary: "8 leads scored and queued with 3-touch sequences.", leadsCreated: 8 } },
      minutesAgo: 190,
      tokensIn: 1400,
      tokensOut: 2100,
    },
    {
      agent: "content",
      input: { topic: "Why gyms lose members in month two", angle: "Retention is an onboarding problem", audience: "studio owners" },
      output: { steps: [{ id: "draft", label: "Drafting content", status: "done" }], current: null, result: { summary: "Drafts ready for approval in your content queue." } },
      minutesAgo: 90,
      tokensIn: 900,
      tokensOut: 1300,
    },
    {
      agent: "proposal",
      input: { clientName: "Brightsmile Dental Group", brief: "New-patient growth campaign", scope: "Discovery\nPaid search setup\nReview automation", budgetNotes: "around $12,000 milestone based", currency: "USD" },
      output: { steps: [{ id: "draft", label: "Drafting proposal", status: "done" }, { id: "render", label: "Branding & rendering", status: "done" }], current: null, result: { summary: "Proposal ready — total $15,000." } },
      minutesAgo: 35,
      tokensIn: 1100,
      tokensOut: 1500,
    },
  ];

  for (const r of runData) {
    await prisma.agentRun.create({
      data: {
        workspaceId: wsId,
        userId,
        agent: r.agent,
        status: "COMPLETED",
        input: r.input as object,
        output: r.output as object,
        model: "crewos-mock-v1",
        tokensIn: r.tokensIn,
        tokensOut: r.tokensOut,
        estCostCents: 0,
        createdAt: new Date(now - r.minutesAgo * 60_000),
        completedAt: new Date(now - (r.minutesAgo - 2) * 60_000),
      },
    });
  }

  const outreachRun = await prisma.agentRun.findFirst({ where: { workspaceId: wsId, agent: "outreach" } });
  const contentRun = await prisma.agentRun.findFirst({ where: { workspaceId: wsId, agent: "content" } });

  const leads: { name: string; company: string; domain: string; score: number; reasons: string; status: "NEW" | "CONTACTED" | "REPLIED" | "WON" | "LOST" }[] = [
    { name: "Jordan Blake", company: "Ironworks Pilates", domain: "ironworkspilates.com", score: 91, reasons: "3 locations · hiring studio manager · active on Instagram", status: "NEW" },
    { name: "Sara Kim", company: "Barre Collective", domain: "barrecollective.com", score: 87, reasons: "recently opened 2nd location", status: "NEW" },
    { name: "Marcus Webb", company: "Summit Strength Co", domain: "summitstrength.co", score: 84, reasons: "runs ClassPass listings", status: "CONTACTED" },
    { name: "Elena Ruiz", company: "FlexFlow Fitness", domain: "flexflowfitness.com", score: 78, reasons: "posts weekly on LinkedIn", status: "CONTACTED" },
    { name: "Tom Larsen", company: "Northside Boxing Club", domain: "northsideboxing.com", score: 74, reasons: "google reviews growing slowly", status: "REPLIED" },
    { name: "Ava Chen", company: "PulseCycle Studios", domain: "pulsecycle.com", score: 71, reasons: "expanding to suburbs", status: "NEW" },
    { name: "Derek Okafor", company: "MotionLab Fitness", domain: "motionlab.fit", score: 66, reasons: "uses booking software", status: "LOST" },
    { name: "Priya Novak", company: "CoreHouse Pilates", domain: "corehousestudio.com", score: 61, reasons: "new website launched", status: "WON" },
  ];

  for (const l of leads) {
    await prisma.lead.create({
      data: {
        workspaceId: wsId,
        runId: outreachRun?.id ?? null,
        name: l.name,
        company: l.company,
        domain: l.domain,
        score: l.score,
        scoreReasons: l.reasons,
        status: l.status,
        emails: [
          { subject: `Quick idea for ${l.company}`, body: `Hi ${l.name.split(" ")[0]},\n\nI noticed ${l.company} fits the profile of studios we help — worth a quick look at automating review requests?\n\nBest,\nDemo Co` },
          { subject: `Re: Quick idea for ${l.company}`, body: `Hi ${l.name.split(" ")[0]},\n\nOne concrete example: a similar studio got 3x Google reviews in 60 days with automated SMS.\n\nReply "send it" for the 1-pager.\n\nBest,\nDemo Co` },
        ],
      },
    });
  }

  const content = [
    ["LINKEDIN", "Why gyms lose members in month two", "Month two is where gyms bleed members — and it's not a pricing problem.\n\nIt's an onboarding problem. New members join motivated, then hit week 5 with no habit, no community, no results yet.\n\nWhat actually works:\n→ Day-1 personal plan, written down\n→ Week-2 check-in (automated, personal tone)\n→ Month-2 milestone celebration\n\nStudios that systematize this cut churn by double digits.\n\nWhat's your month-two play?"],
    ["X_THREAD", "Why gyms lose members in month two", "1/ Gyms don't lose members in month one. They lose them in month two — after motivation fades and before habit forms.\n\n2/ The fix isn't discounts. It's a designed onboarding: day-1 plan, week-2 check-in, month-2 milestone.\n\n3/ Automate the check-ins. Personalize the tone. Keep the human touch where it matters: the milestone."],
    ["BLOG_OUTLINE", "Why gyms lose members in month two", "# Member Retention Is an Onboarding Problem\n\n## 1. The month-two cliff (data + anecdote)\n## 2. Why discounts train churn\n## 3. The 3-touch onboarding system\n## 4. Automating check-ins without sounding robotic\n## 5. 30-day rollout checklist"],
    ["LINKEDIN", "Agencies: your reports should sell the retainer", "Client reports shouldn't document work. They should sell the next one.\n\nMost agency reports are spreadsheets of what happened. The client reads two lines and thinks 'what am I paying for?'\n\nReframe every report around: what we tried → what it earned → what's next.\n\nThat's it. That's the retainer saver."],
  ] as const;

  for (const [type, title, body] of content) {
    await prisma.contentItem.create({
      data: {
        workspaceId: wsId,
        runId: contentRun?.id ?? null,
        type: type as "LINKEDIN" | "X_THREAD" | "BLOG_OUTLINE",
        title,
        body,
        status: type === "LINKEDIN" && title.startsWith("Agencies") ? "APPROVED" : "DRAFT",
      },
    });
  }

  const proposalData = {
    summary: "Brightsmile Dental Group engaged us to grow new-patient bookings. This proposal covers a focused four-week engagement: audit, paid search setup, and an automated review flywheel.",
    scopeItems: ["Discovery & local-market audit", "Paid search campaign build", "Review-request automation", "Handoff & training"],
    pricingLines: [
      { description: "Discovery & audit (week 1)", amountCents: 300000 },
      { description: "Campaign build & automation (weeks 2-3)", amountCents: 900000 },
      { description: "Optimization & handoff (week 4)", amountCents: 300000 },
    ],
    terms: ["50% deposit due on signature, 50% on delivery.", "Two revision rounds included.", "Rates valid for 30 days."],
  };
  const brand = { name: "Demo Co", color: "#10b981", logoUrl: null };
  const html = proposalHtml(brand, { ...proposalData, totalCents: totalCents(proposalData.pricingLines) }, "Brightsmile Dental Group");
  await prisma.document.create({
    data: {
      workspaceId: wsId,
      type: "PROPOSAL",
      title: "Proposal — Brightsmile Dental Group",
      data: { ...proposalData, totalCents: totalCents(proposalData.pricingLines), clientName: "Brightsmile Dental Group", currency: "USD" } as object,
      html,
    },
  });

  // 14 days of usage history so the dashboard charts look alive.
  for (let i = 13; i >= 0; i--) {
    const dayEvents = 1 + ((i * 7) % 3);
    for (let j = 0; j < dayEvents; j++) {
      const agent = ["outreach", "content", "proposal"][(i + j) % 3];
      await prisma.usageEvent.create({
        data: {
          workspaceId: wsId,
          userId,
          agent,
          model: "crewos-mock-v1",
          tokensIn: 700 + ((i * 37 + j * 13) % 900),
          tokensOut: 900 + ((i * 53 + j * 29) % 1200),
          estCostCents: 0,
          createdAt: new Date(now - i * 24 * 3600 * 1000 - j * 3600 * 1000),
        },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      { workspaceId: wsId, title: "Outreach Agent finished", body: "8 leads scored and queued with 3-touch sequences." },
      { workspaceId: wsId, title: "Proposal ready", body: "Proposal — Brightsmile Dental Group ($15,000)." },
    ],
  });
}

export async function ensureDemoData(): Promise<{ userId: string; wsId: string }> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo Founder", emailVerified: new Date() },
  });

  let ws = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (!ws) {
    ws = await prisma.workspace.create({
      data: {
        name: "Demo Co",
        slug: DEMO_SLUG,
        plan: "GROWTH",
        brandName: "Demo Co",
        brandColor: "#10b981",
        referralCode: "CREW-DEMO01",
      },
    });
    await prisma.membership.create({ data: { userId: user.id, workspaceId: ws.id, role: "OWNER" } });
    await seedDemoContent(ws.id, user.id);
  }
  return { userId: user.id, wsId: ws.id };
}
