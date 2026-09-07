"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PLANS } from "@/lib/plans";
import { fmtUsd } from "@/lib/format";
import { ThemeToggle } from "./theme";

/* ── Nav ─────────────────────────────────────────────────────── */

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950">C</span>
          CrewOS
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex dark:text-zinc-400">
          <a href="#agents" className="hover:text-emerald-500">AI Employees</a>
          <a href="#roi" className="hover:text-emerald-500">ROI</a>
          <a href="#compare" className="hover:text-emerald-500">Compare</a>
          <a href="#pricing" className="hover:text-emerald-500">Pricing</a>
          <a href="#faq" className="hover:text-emerald-500">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm font-semibold text-zinc-600 hover:text-emerald-500 sm:block dark:text-zinc-300">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            Hire your crew
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-500"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Your AI crew clocks in today
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mx-auto max-w-3xl text-4xl font-black tracking-tight md:text-6xl"
        >
          Hire <span className="text-emerald-500">AI employees</span>, not freelancers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400"
        >
          CrewOS runs your outreach, content, and proposals with AI workers that never sleep, never
          quit, and cost less than one freelance day per month.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/signup"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            Start with a Starter plan →
          </Link>
          <a
            href="#agents"
            className="rounded-xl border border-zinc-300 px-6 py-3 font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Meet the crew
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-sm"
        >
          {[
            ["24/7", "agents never clock out"],
            ["<1 day", "to your first AI hire"],
            ["10x", "ROI or it's not worth buying"],
          ].map(([big, small]) => (
            <div key={small} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-2xl font-black text-emerald-500">{big}</div>
              <div className="mt-1 text-zinc-500 dark:text-zinc-400">{small}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Agent showcase ──────────────────────────────────────────── */

const AGENTS = [
  {
    icon: "🎯",
    name: "Outreach Agent",
    pitch: "Finds your ideal customers, scores them 0–100, and writes a 3-touch personalized sequence for every lead.",
    points: ["Scored lead lists on demand", "Personalized 3-email sequences", "Pipeline board with reply tracking"],
  },
  {
    icon: "✍️",
    name: "Content Agent",
    pitch: "LinkedIn posts, X threads, and blog outlines from one prompt — queued for your approval, never auto-posted.",
    points: ["Platform-native drafts", "Human approval queue", "Consistent posting cadence"],
  },
  {
    icon: "📄",
    name: "Proposal Agent",
    pitch: "Turns a client brief into a branded, printable proposal with scope, pricing lines, and terms in minutes.",
    points: ["Your brand, auto-applied", "Scope + pricing + terms", "Print-ready documents"],
  },
];

export function AgentShowcase() {
  return (
    <section id="agents" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Meet your first three hires</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
          Every agent is a specialist. Hire one, or run the whole crew. Cancel anytime.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {AGENTS.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">{a.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{a.name}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{a.pitch}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                    <span className="mt-0.5 text-emerald-500">✓</span> {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────── */

export function HowItWorks() {
  const steps = [
    ["1", "Describe the work", "Tell the agent your ideal customer, your offer, your voice. Two minutes, plain English."],
    ["2", "Your AI employee executes", "It drafts leads, content, or proposals. You watch it work in real time."],
    ["3", "Approve & ship", "Nothing goes out without your click. Approve, edit, or regenerate — then move on."],
  ];
  return (
    <section className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Onboard in an afternoon</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(([n, t, b]) => (
            <div key={n} className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-black text-emerald-950">{n}</div>
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ROI calculator ──────────────────────────────────────────── */

export function RoiCalculator() {
  const [teamSize, setTeamSize] = useState(2);
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [wage, setWage] = useState(30);

  const { manualCost, crewosCost, savingsPct, hoursYear } = useMemo(() => {
    const manual = teamSize * hoursPerWeek * 4.33 * wage;
    const crew = 49900 / 100;
    return {
      manualCost: Math.round(manual * 100),
      crewosCost: Math.round(crew * 100),
      savingsPct: manual > 0 ? Math.max(0, Math.round((1 - crew / manual) * 100)) : 0,
      hoursYear: Math.round(teamSize * hoursPerWeek * 52),
    };
  }, [teamSize, hoursPerWeek, wage]);

  return (
    <section id="roi" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Run the numbers</h2>
        <div className="mt-10 grid gap-8 rounded-2xl border border-zinc-200 bg-white p-8 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-5">
            <div>
              <label className="flex justify-between text-sm font-medium">
                Repetitive tasks done by humans <span className="text-emerald-500">{teamSize} people</span>
              </label>
              <input type="range" min={1} max={10} value={teamSize} onChange={(e) => setTeamSize(+e.target.value)} className="mt-2 w-full accent-emerald-500" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium">
                Hours each, per week <span className="text-emerald-500">{hoursPerWeek}h</span>
              </label>
              <input type="range" min={1} max={40} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(+e.target.value)} className="mt-2 w-full accent-emerald-500" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium">
                Their loaded hourly cost <span className="text-emerald-500">${wage}/h</span>
              </label>
              <input type="range" min={12} max={120} value={wage} onChange={(e) => setWage(+e.target.value)} className="mt-2 w-full accent-emerald-500" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-xl bg-zinc-50 p-6 dark:bg-zinc-950">
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">That work costs you</div>
              <div className="text-3xl font-black">{fmtUsd(manualCost)}<span className="text-base font-semibold text-zinc-500">/mo</span></div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">With CrewOS Growth</div>
              <div className="text-3xl font-black text-emerald-500">{fmtUsd(crewosCost)}<span className="text-base font-semibold text-zinc-500">/mo</span></div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-4 text-sm">
              <strong className="text-emerald-500">{savingsPct}% saved</strong> and{" "}
              <strong>{hoursYear.toLocaleString()} hours/year</strong> back on the tasks an AI crew does daily.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Comparison ──────────────────────────────────────────────── */

export function Comparison() {
  const rows: [string, string, string, string][] = [
    ["Monthly cost", "$199–$999", "$2,000–$10,000", "$4,500+/mo each"],
    ["Onboarding time", "Same afternoon", "1–3 weeks", "1–2 months"],
    ["Works 24/7", "✓", "✗", "✗"],
    ["Quits / churns", "Never", "Often", "Constantly"],
    ["Scales instantly", "✓ (upgrade plan)", "✗ (re-hire)", "✗ (new headcount)"],
    ["Every action logged", "✓", "Partial", "Partial"],
  ];
  const head = ["", "CrewOS", "Freelancers", "Full-time hire"];
  return (
    <section id="compare" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">CrewOS vs. the alternatives</h2>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                {head.map((h, i) => (
                  <th key={i} className={`p-4 text-left font-bold ${i === 1 ? "text-emerald-500" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="p-4 font-medium">{r[0]}</td>
                  {r.slice(1).map((c, i) => (
                    <td key={i} className={`p-4 ${i === 0 ? "font-semibold text-emerald-500" : "text-zinc-600 dark:text-zinc-400"}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────────── */

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const plans = [PLANS.STARTER, PLANS.GROWTH, PLANS.SCALE];
  return (
    <section id="pricing" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Payroll for your AI crew</h2>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className={!annual ? "font-bold" : "text-zinc-500"}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className="relative h-6 w-11 rounded-full bg-zinc-300 transition dark:bg-zinc-700"
            aria-label="Toggle annual billing"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${annual ? "left-[22px]" : "left-0.5"}`} />
          </button>
          <span className={annual ? "font-bold" : "text-zinc-500"}>
            Annual <span className="text-emerald-500">(2 months free)</span>
          </span>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 ${
                p.id === "GROWTH"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {p.id === "GROWTH" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-emerald-950">
                  MOST POPULAR
                </div>
              )}
              <h3 className="font-bold">{p.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-black">{fmtUsd(annual ? p.annualCents / 12 : p.monthlyCents)}</span>
                <span className="text-zinc-500">/mo</span>
              </div>
              {annual && <div className="mt-1 text-xs text-emerald-500">{fmtUsd(p.annualCents)} billed yearly — 2 months free</div>}
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{p.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-bold transition ${
                  p.id === "GROWTH"
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                Hire {p.name === "Starter" ? "your first agent" : "the crew"}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Enterprise (SSO, custom agents, dedicated models): <a href="mailto:sales@crewos.app" className="font-semibold text-emerald-500">talk to us</a>
        </p>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────── */

export function Faq() {
  const faqs: [string, string][] = [
    ["Is my data used to train AI models?", "No. Your prompts and outputs are your workspace data. Provider calls are per-request and not used for training."],
    ["What counts as an agent run?", "One complete agent execution — e.g. one outreach run producing up to 25 scored leads with full sequences."],
    ["Can I cancel anytime?", "Yes. Self-serve billing portal, no retention calls, no cancellation fees. Annual plans are refunded pro-rata in the first 30 days."],
    ["What if the AI makes a mistake?", "Nothing is sent automatically. Every lead sequence, post, and proposal sits in an approval queue until you act on it."],
    ["Which AI models do you use?", "We route each task to the best model tier (OpenAI, Anthropic, Google, or local Ollama) and show you usage and estimated cost per run."],
    ["Do you offer support?", "Every plan gets email support. Growth adds priority response; Scale gets a dedicated channel."],
  ];
  return (
    <section id="faq" className="border-t border-zinc-200 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Questions, answered</h2>
        <div className="mt-10 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="mr-2 text-emerald-500 transition group-open:rotate-90 inline-block">▸</span>
                {q}
              </summary>
              <p className="mt-3 pl-6 text-sm text-zinc-600 dark:text-zinc-400">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer CTA + footer ─────────────────────────────────────── */

export function FooterCta() {
  return (
    <section className="border-t border-zinc-200 py-24 dark:border-zinc-800">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-black tracking-tight md:text-5xl">
          Your competitors are still <span className="text-zinc-500 dark:text-zinc-600">hiring humans</span> for robot work.
        </h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Spin up your AI crew in the next 10 minutes. First run takes less time than writing a job post.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-xl bg-emerald-500 px-8 py-4 font-bold text-emerald-950 transition hover:bg-emerald-400"
        >
          Hire your AI crew →
        </Link>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 py-10 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-xs text-emerald-950">C</span>
          CrewOS
        </div>
        <div>© {new Date().getFullYear()} CrewOS. AI employees, zero drama.</div>
        <div className="flex gap-4">
          <a href="#pricing" className="hover:text-emerald-500">Pricing</a>
          <a href="#faq" className="hover:text-emerald-500">FAQ</a>
          <Link href="/login" className="hover:text-emerald-500">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
