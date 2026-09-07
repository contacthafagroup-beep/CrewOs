"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";

export interface LeadEmail {
  subject: string;
  body: string;
}

export interface LeadDTO {
  id: string;
  name: string;
  company: string;
  domain: string | null;
  score: number;
  scoreReasons: string | null;
  status: "NEW" | "CONTACTED" | "REPLIED" | "WON" | "LOST";
  emails: LeadEmail[];
}

const COLUMNS: { key: LeadDTO["status"]; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "REPLIED", label: "Replied" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

function scoreTone(score: number): "green" | "yellow" | "zinc" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "zinc";
}

export function LeadBoard({ initialLeads }: { initialLeads: LeadDTO[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [saving, setSaving] = useState<string | null>(null);

  async function setStatus(id: string, status: LeadDTO["status"]) {
    setSaving(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    setSaving(null);
  }

  return (
    <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col.key);
        return (
          <div key={col.key} className="min-w-56 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wide text-zinc-500">{col.label}</span>
              <span className="text-xs font-bold text-zinc-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 && <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-400 dark:border-zinc-700">empty</div>}
              {items.map((l) => (
                <div key={l.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold leading-tight">{l.name}</div>
                      <div className="text-xs text-zinc-500">{l.company}{l.domain ? ` · ${l.domain}` : ""}</div>
                    </div>
                    <Badge tone={scoreTone(l.score)}>{l.score}</Badge>
                  </div>
                  {l.scoreReasons && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{l.scoreReasons}</p>}
                  {l.emails.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-emerald-500">{l.emails.length}-touch sequence</summary>
                      <div className="mt-2 space-y-2">
                        {l.emails.map((e, i) => (
                          <div key={i} className="rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
                            <div className="font-bold">{e.subject}</div>
                            <div className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{e.body}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  <select
                    value={l.status}
                    disabled={saving === l.id}
                    onChange={(e) => setStatus(l.id, e.target.value as LeadDTO["status"])}
                    className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
