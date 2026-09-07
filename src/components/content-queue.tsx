"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";

export interface ContentDTO {
  id: string;
  type: "LINKEDIN" | "X_THREAD" | "BLOG_OUTLINE";
  title: string;
  body: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const TYPE_LABEL: Record<ContentDTO["type"], string> = {
  LINKEDIN: "LinkedIn post",
  X_THREAD: "X thread",
  BLOG_OUTLINE: "Blog outline",
};

export function ContentQueue({ initialItems }: { initialItems: ContentDTO[] }) {
  const [items, setItems] = useState(initialItems);
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function patch(id: string, data: { status?: ContentDTO["status"]; body?: string }) {
    await fetch("/api/content", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    }).catch(() => {});
  }

  function setStatus(id: string, status: ContentDTO["status"]) {
    const body = dirty[id];
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, body: body ?? i.body } : i)));
    setDirty((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    void patch(id, { status, ...(body !== undefined ? { body } : {}) });
    setSavedFlash(status === "APPROVED" ? "Approved — ready to ship" : "Sent back to drafts");
    setTimeout(() => setSavedFlash(null), 2000);
  }

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const pending = items.filter((i) => i.status === "DRAFT");
  const rest = items.filter((i) => i.status !== "DRAFT");

  return (
    <div className="space-y-6">
      {savedFlash && (
        <div className="rounded-lg bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-500">{savedFlash}</div>
      )}
      {[...pending, ...rest].map((item) => {
        const current = dirty[item.id] ?? item.body;
        const isDirty = dirty[item.id] !== undefined && dirty[item.id] !== item.body;
        return (
          <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={item.type === "LINKEDIN" ? "blue" : item.type === "X_THREAD" ? "zinc" : "yellow"}>
                  {TYPE_LABEL[item.type]}
                </Badge>
                <span className="text-sm font-bold">{item.title}</span>
              </div>
              <Badge tone={item.status === "APPROVED" ? "green" : item.status === "REJECTED" ? "red" : "yellow"}>
                {item.status}
              </Badge>
            </div>
            <textarea
              value={current}
              onChange={(e) => setDirty((d) => ({ ...d, [item.id]: e.target.value }))}
              rows={item.type === "BLOG_OUTLINE" ? 12 : 8}
              className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => setStatus(item.id, "APPROVED")}>
                ✓ Approve
              </Button>
              <Button variant="danger" onClick={() => setStatus(item.id, "REJECTED")}>
                Reject
              </Button>
              {isDirty && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void patch(item.id, { body: current });
                    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, body: current } : i)));
                    setDirty((d) => {
                      const next = { ...d };
                      delete next[item.id];
                      return next;
                    });
                  }}
                >
                  Save edits
                </Button>
              )}
              <Button variant="ghost" onClick={() => copy(item.id, current)}>
                {copied === item.id ? "Copied ✓" : "Copy"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
