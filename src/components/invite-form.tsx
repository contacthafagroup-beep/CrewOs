"use client";

import { useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";

export function InviteForm({ canInvite }: { canInvite: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!canInvite) {
    return <p className="text-sm text-zinc-500">Only workspace owners and admins can invite teammates.</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setErr(data.error ?? "Invite failed");
      else {
        setMsg(`Invitation sent to ${email}. They can sign in with that email.`);
        setEmail("");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="invite-email">Teammate email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
        />
      </div>
      <div className="w-full sm:w-40">
        <Label htmlFor="invite-role">Role</Label>
        <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Inviting…" : "Invite"}
      </Button>
      {msg && <p className="text-sm text-emerald-500">{msg}</p>}
      {err && <p className="text-sm text-red-500">{err}</p>}
    </form>
  );
}
