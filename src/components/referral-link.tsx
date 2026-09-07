"use client";

import { useState } from "react";

export function ReferralLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/?ref=${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
