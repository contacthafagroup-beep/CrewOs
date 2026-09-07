"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";

export function BrandForm({
  initialBrandName,
  initialBrandColor,
  initialBrandLogoUrl,
}: {
  initialBrandName: string;
  initialBrandColor: string;
  initialBrandLogoUrl: string;
}) {
  const [brandName, setBrandName] = useState(initialBrandName);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialBrandLogoUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandName, brandColor, brandLogoUrl }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setErr(data.error ?? "Save failed");
      else setMsg("Saved — new proposals will use this branding.");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="brandName">Brand name (appears on proposals)</Label>
        <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} required maxLength={80} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brandColor">Brand color</Label>
          <div className="flex gap-2">
            <input
              id="brandColor"
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#10b981"}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800"
            />
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#10b981" />
          </div>
        </div>
        <div>
          <Label htmlFor="brandLogoUrl">Logo URL (optional)</Label>
          <Input
            id="brandLogoUrl"
            type="url"
            value={brandLogoUrl}
            onChange={(e) => setBrandLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save branding"}
        </Button>
        {msg && <span className="text-sm text-emerald-500">{msg}</span>}
        {err && <span className="text-sm text-red-500">{err}</span>}
      </div>
    </form>
  );
}
