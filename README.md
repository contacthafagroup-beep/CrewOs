# CrewOS

[![CI](https://github.com/contacthafagroup-beep/CrewOs/actions/workflows/ci.yml/badge.svg)](https://github.com/contacthafagroup-beep/CrewOs/actions/workflows/ci.yml)

**Hire AI employees, not freelancers.** CrewOS is an AI workforce platform: companies subscribe and get AI agents that run sales outreach, content marketing, and client proposals — with a human approval queue before anything ships.

Built to run on **free-tier infrastructure** until revenue exists: Next.js 15 + PostgreSQL (Neon free tier) + Vercel free tier + DB-backed queue (no Redis required at launch).

## Quickstart (≈3 minutes)

```bash
npm install

# 1. Create a free Postgres at https://neon.tech and copy the connection string
cp .env.example .env
#    → set DATABASE_URL in .env

# 2. Create tables + seed a demo workspace
npm run setup

# 3. Run
npm run dev
```

Open http://localhost:3000 → **Log in** → **"🚀 Explore the live demo workspace"**. The demo workspace ships pre-loaded with leads, content drafts, a proposal, and 14 days of usage history.

**Zero-key mode:** with no API keys set, agents run on a deterministic mock provider so the entire product — runs, metering, limits, artifacts — is testable end-to-end. Real generation activates automatically the moment you add any one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OLLAMA_BASE_URL`.

## Verify your checkout

```bash
npm test          # 26 unit tests (plans, JSON robustness, scoring, rate limit, referrals, pricing)
npm run smoke     # AI-layer contract test through the real router (mock provider)
npx tsc --noEmit  # strict types
npx next build    # production build with zero env vars
```

## What's inside

| Area | Implementation |
|---|---|
| AI employees | Outreach (leads + sequences), Content (LinkedIn/X/blog drafts), Proposal (branded printable docs) |
| Agent runtime | Table-driven engine with step tracking, usage metering, plan limits |
| AI router | OpenAI / Anthropic / Gemini / Ollama adapters (plain fetch), model tiers (fast/balanced/premium), robust JSON extraction |
| Billing | Stripe Checkout + customer portal + signature-verified webhooks, 3 plans + annual (2 months free) |
| Auth | Email magic link, Google OAuth, Microsoft OAuth, JWT sessions — plus gated demo login |
| Growth | Referral links with $100 credits, plan-gated usage, notifications |
| Ops | DB-backed job queue + worker, rate limiting, security headers, zod validation everywhere |

Full guides: [DEPLOYMENT.md](DEPLOYMENT.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · strategy & sales playbooks in [`docs/strategy/`](docs/strategy/).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run setup` | `prisma db push` + demo seed |
| `npm run seed` | Re-seed demo workspace (idempotent) |
| `npm run worker` | Background job worker (5s loop) |
| `npm run smoke` | AI-contract smoke test (no keys needed) |
| `npm test` | Unit tests (Node test runner, zero extra deps) |
| `npm run db:studio` | Prisma Studio |

## Production checklist (short version)

1. `DATABASE_URL` → Neon pooled connection
2. `AUTH_SECRET` → `openssl rand -base64 32`, `DEMO_MODE="false"`
3. Stripe keys + 6 recurring prices → `.env` (see DEPLOYMENT.md)
4. `WORKER_INLINE="false"` + Vercel Cron hitting `/api/worker/tick` (or run `npm run worker` on any box)
5. Deploy → webhook endpoint → first customer. Details: **DEPLOYMENT.md**.
