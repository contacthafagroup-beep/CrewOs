"use client";

import { useState } from "react";

interface AuthPanelProps {
  mode: "login" | "signup";
  demoEnabled: boolean;
  oauthGoogle: boolean;
  oauthMicrosoft: boolean;
  error?: string;
}

const ERRORS: Record<string, string> = {
  invalid_token: "That sign-in link is invalid or expired. Request a new one.",
  missing_token: "That sign-in link is malformed. Request a new one.",
  oauth_not_configured: "This sign-in provider isn't configured on this deployment yet.",
  oauth_state_mismatch: "Sign-in session expired — try again.",
  oauth_failed: "Sign-in failed. Try again or use email.",
};

export function AuthPanel({ mode, demoEnabled, oauthGoogle, oauthMicrosoft, error }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(error ? (ERRORS[error] ?? error) : null);
  const [demoBusy, setDemoBusy] = useState(false);

  async function submitMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSending(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErr(data.error ?? "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      setErr("Network error — try again");
    } finally {
      setSending(false);
    }
  }

  async function demoLogin() {
    setErr(null);
    setDemoBusy(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErr(data.error ?? "Demo login unavailable");
      } else {
        window.location.href = "/app";
      }
    } catch {
      setErr("Network error — try again");
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-2xl font-black tracking-tight">
        {mode === "login" ? "Welcome back" : "Hire your first AI employee"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "login" ? "Sign in to your workspace." : "Set up your workspace in under a minute."}
      </p>

      {err && <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{err}</div>}

      {sent ? (
        <div className="mt-6 rounded-lg bg-emerald-500/10 p-4 text-sm">
          <strong className="text-emerald-500">Check your inbox.</strong>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            We sent a sign-in link to {email}. In local dev without an email key, the link is printed in the
            server console.
          </p>
        </div>
      ) : (
        <form onSubmit={submitMagicLink} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Continue with email"}
          </button>
        </form>
      )}

      {(oauthGoogle || oauthMicrosoft) && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> or <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="space-y-2">
            {oauthGoogle && (
              <a
                href="/api/auth/oauth/google"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <span>🔵</span> Continue with Google
              </a>
            )}
            {oauthMicrosoft && (
              <a
                href="/api/auth/oauth/microsoft"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <span>🟦</span> Continue with Microsoft
              </a>
            )}
          </div>
        </>
      )}

      {demoEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> or <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <button
            type="button"
            onClick={demoLogin}
            disabled={demoBusy}
            className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-500 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {demoBusy ? "Preparing demo…" : "🚀 Explore the live demo workspace"}
          </button>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Pre-loaded with leads, content, and a proposal. No card, no signup.
          </p>
        </>
      )}
    </div>
  );
}
