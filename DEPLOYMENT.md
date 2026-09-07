# Deploying CrewOS — from $0 to first paying customer

The stack below costs $0 until you have paying users (free tiers sized for launch traffic).

## 1. Database — Neon (free tier)

1. Create a project at https://neon.tech (region closest to your target market — US East for US/UK sales).
2. Copy the **pooled** connection string → `DATABASE_URL` in `.env`.
3. Push schema + seed: `npm run setup`.

## 2. App — Vercel (free tier)

1. Push this folder to a Git repo, import into Vercel (or `npx vercel`).
2. Environment variables (Production + Preview): everything in `.env.example` you intend to use.
   - Required: `DATABASE_URL`, `AUTH_SECRET`, `DEMO_MODE="false"`, `WORKER_INLINE="false"`
   - Real AI: any one provider key. Recommended launch routing: `OPENAI_API_KEY` (cheap, reliable JSON mode).
3. Deploy. Domain: add your domain (or start on `*.vercel.app` and switch after first 10 customers).

## 3. Auth

- `AUTH_SECRET`: `openssl rand -base64 32`
- **Magic links (works day one):** add `RESEND_API_KEY` (free 100 emails/day at resend.com) + `EMAIL_FROM` with your domain. Without a key, links print to server logs (dev only).
- **Google OAuth:** console.cloud.google.com → OAuth client (Web) → redirect URI `https://yourdomain.com/api/auth/oauth/google/callback` → set `GOOGLE_CLIENT_ID/SECRET`.
- **Microsoft:** portal.azure.com → App registration → Web redirect `https://yourdomain.com/api/auth/oauth/microsoft/callback` → set `MICROSOFT_CLIENT_ID/SECRET`.

## 4. Stripe billing

1. Create 6 recurring **prices** (monthly + annual × 3 plans). Annual = 10× monthly (2 months free):

| Plan | Monthly | Annual |
|---|---|---|
| Starter | $199 | $1,990 |
| Growth | $499 | $4,990 |
| Scale | $999 | $9,990 |

2. Put the six `price_...` ids into `STRIPE_PRICE_{PLAN}_{MONTHLY|ANNUAL}`.
3. `STRIPE_SECRET_KEY` from dashboard → API keys.
4. Webhook: Stripe → Developers → Webhooks → **Add endpoint**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
5. Local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Checkout, portal, plan sync, and referral credits activate automatically once these are set.

## 5. Worker

With `WORKER_INLINE="false"` in production, agent runs are enqueued as durable jobs. Process them with **one** of:

- **Vercel Cron** (vercel.json): `POST /api/worker/tick` every minute with header `x-worker-token: $WORKER_TOKEN`.
- **Any always-on box** (free Oracle VM, a Raspberry Pi, a Fly.io machine): `WORKER_TOKEN=... npm run worker`.

## 6. Go-live order (first revenue)

1. Deploy → run `npm run smoke` locally + check `/login` loads with demo disabled.
2. Connect Stripe in test mode → subscribe once with `4242 4242 4242 4242` → verify webhook sync + plan change.
3. Flip to live keys. Send yourself one real proposal + one outreach run.
4. Set up a **master inbox** for cold outreach (see `docs/strategy/go-to-market-30day.md` for warmup + daily quotas).
5. Launch week: Product Hunt + HN on the same Tuesday 00:01 PT (playbook in docs/strategy).
6. Talk to 10 prospects before writing a line of new code. Ship what they ask for.

## Monitoring & hygiene

- Vercel Analytics (free) + `console` drain → Axiom/Logtail free tier for error alerts.
- Workspace settings page (`/app/settings`) shows a live config checklist — use it after every deploy.
- Stripe → customer portal branding: set logo + support email so churners see a polished downgrade flow.
