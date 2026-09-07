# 90-Day Scaling Roadmap + Enterprise Motion

## Month 1 — Prove (target: 3–5 paying, 10 design partners)

- Ship everything in `DEPLOYMENT.md` go-live order; run the 30-day playbook.
- Instrument honestly: MRR, calls held, reply rate, activation (first run within 1 hour of signup).
- Exit criteria: 3+ customers paying, 2+ case studies with hours-saved numbers, <4% weekly churn signal.

## Month 2 — Deepen (target: ~$10–15k MRR)

- **Product:** ship the #1 requested agent from design partners (likely Support/Review-Response or Research Briefing — the runtime makes this a new file, not a rebuild). Add per-workspace SMTP/Resend so Outreach can send directly (warmup guidance included) → upgrades Growth→Scale.
- **Growth:** double down on the single best-closing niche; write 8 comparison/SEO pages with the Content Agent; activate 2-way referrals ($100 credits are live in code); first partnership: agencies white-labeling a Crew workspace.
- **Pricing experiment:** usage overage packs ("extra 500 runs for $199") — validate expansion revenue.

## Month 3 — Scale what worked (target: $25–40k MRR trajectory)

- **Team:** first hire = part-time appointment-setter on commission from the pipeline you now have; founder stays on demos.
- **Product:** audit log + SSO starters for the enterprise motion; per-seat analytics exports.
- **Channel:** marketplace listings (Microsoft AppSource/Google Workspace) — slow but compounding; PR angle: publish your own MRR build-log (transparent metrics travel).
- **Infra:** Redis-backed queue swap if worker lag >1 min; region-failover review; SOC2-style controls documented (see below).

## Enterprise motion (start month 2, close month 4+)

1. **Who:** 50–500-seat agencies and BPOs running many client accounts — they feel multi-agent value × every client.
2. **Wedge offer:** "Managed AI crew pilot — $5k for 60 days, one client workflow, success metrics agreed upfront."
3. **Requirements they will hit first** (already anticipated in architecture): SSO → add enterprise IdP to the OAuth layer; audit trail → `AgentRun`/`UsageEvent` are the base; data-residency → Postgres region choice; custom agents → runtime already takes definitions.
4. **Pricing:** $2–5k/mo floor, annual prepay, implementation fee. Never discount the platform — discount services.
5. **Moat note:** enterprise buys the approval queue + auditability, not raw generation. Lead with compliance posture, not AI demos.

## Trust & controls backlog (enterprise-blocking, sequenced)

1. Audit-log page over `AgentRun`/`UsageEvent` (mostly queries — cheap).
2. SSO (Entra/Google Workspace) via existing OAuth layer.
3. Data-processing addendum + subprocessor list (model providers documented in ARCHITECTURE).
4. Pen-test-lite: rate-limit review, session expiry policy, dependency audit in CI.
5. SOC2 readiness only after a $2k+/mo enterprise lead asks in writing.

## Metrics that decide the next quarter

- **Activation:** first agent run <1h from signup (target 60%+)
- **Pipeline math:** touches → calls (≥2%) → offers (≥40%) → close (≥25%)
- **NRR:** referrals + overage + plan upgrades > 110%
- **Gross margin:** token cost per workspace < 8% of its subscription (model routing exists for this — watch it in your own dashboard)
- **The only vanity metric to ignore:** signups without a run.
