"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AgentSpec } from "@/lib/agents/types";
import { Button, Input, Label, Select, Textarea, StatusBadge } from "@/components/ui";

export interface RunDTO {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  error?: string | null;
  output?: {
    steps?: { id: string; label: string; status: string }[];
    current?: string | null;
    result?: { summary?: string; leadsCreated?: number; documentId?: string };
  } | null;
}

export function RunAgentForm({ spec, aiConfigured }: { spec: AgentSpec; aiConfigured: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const i of spec.inputs) init[i.field] = i.defaultValue ?? "";
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunDTO | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  async function poll(id: string, tries = 0) {
    if (tries > 60) return;
    const res = await fetch(`/api/agent-runs/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { run?: RunDTO; error?: string };
    if (data.run) {
      setRun(data.run);
      if (data.run.status === "QUEUED" || data.run.status === "RUNNING") {
        pollRef.current = setTimeout(() => poll(id, tries + 1), 2000);
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setRun(null);
    try {
      const res = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: spec.id, input: values }),
      });
      const data = (await res.json()) as { run?: RunDTO; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Run failed to start");
      } else if (data.run) {
        setRun(data.run);
        if (data.run.status === "QUEUED" || data.run.status === "RUNNING") {
          pollRef.current = setTimeout(() => poll(data.run!.id), 2000);
        }
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  const done = run?.status === "COMPLETED";
  const steps = run?.output?.steps ?? spec.steps.map((s) => ({ ...s, status: "pending" }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {!aiConfigured && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500">
            No AI provider configured — runs use a deterministic <strong>mock provider</strong> so you can test the full flow. Add an API key in
            <code className="mx-1 rounded bg-black/10 px-1 dark:bg-white/10">.env</code> for real output.
          </div>
        )}
        {spec.inputs.map((input) => (
          <div key={input.field}>
            <Label htmlFor={input.field}>
              {input.label}
              {input.required && <span className="text-emerald-500"> *</span>}
            </Label>
            {input.type === "textarea" && (
              <Textarea
                id={input.field}
                value={values[input.field] ?? ""}
                placeholder={input.placeholder}
                required={input.required}
                onChange={(e) => setValues((v) => ({ ...v, [input.field]: e.target.value }))}
              />
            )}
            {input.type === "text" && (
              <Input
                id={input.field}
                value={values[input.field] ?? ""}
                placeholder={input.placeholder}
                required={input.required}
                onChange={(e) => setValues((v) => ({ ...v, [input.field]: e.target.value }))}
              />
            )}
            {input.type === "number" && (
              <Input
                id={input.field}
                type="number"
                value={values[input.field] ?? ""}
                placeholder={input.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [input.field]: e.target.value }))}
              />
            )}
            {input.type === "select" && (
              <Select
                id={input.field}
                value={values[input.field] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [input.field]: e.target.value }))}
              >
                {(input.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            )}
            {input.help && <p className="mt-1 text-xs text-zinc-500">{input.help}</p>}
          </div>
        ))}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Starting…" : `▶ Run ${spec.name}`}
        </Button>
        {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
      </form>

      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Run status</h2>
          {run && <StatusBadge status={run.status} />}
        </div>
        {!run ? (
          <p className="py-8 text-center text-sm text-zinc-500">Fill the brief and hit run. Your agent&apos;s progress appears here live.</p>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-2">
              {steps.map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      s.status === "done"
                        ? "bg-emerald-500 text-emerald-950"
                        : s.status === "running"
                          ? "animate-pulse bg-sky-500 text-white"
                          : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                    }`}
                  >
                    {s.status === "done" ? "✓" : s.status === "running" ? "•" : ""}
                  </span>
                  {s.label}
                </li>
              ))}
            </ol>

            {run.status === "FAILED" && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{run.error ?? "Run failed"}</div>
            )}

            {done && (
              <div className="rounded-lg bg-emerald-500/10 p-4 text-sm">
                <div className="font-bold text-emerald-500">Done ✅</div>
                <p className="mt-1">{run.output?.result?.summary ?? "Completed."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {spec.id === "outreach" && (
                    <Link href="/app/leads" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950">
                      View leads →
                    </Link>
                  )}
                  {spec.id === "content" && (
                    <Link href="/app/content" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950">
                      Review drafts →
                    </Link>
                  )}
                  {spec.id === "proposal" && (
                    <Link href="/app/documents" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950">
                      Open documents →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
