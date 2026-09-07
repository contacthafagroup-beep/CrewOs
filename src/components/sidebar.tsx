"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NotificationDTO {
  id: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

const NAV = [
  { href: "/app", label: "Overview", icon: "📊" },
  { href: "/app/agents", label: "AI Employees", icon: "🤖" },
  { href: "/app/runs", label: "Run history", icon: "🕐" },
  { href: "/app/leads", label: "Leads", icon: "🎯" },
  { href: "/app/content", label: "Content queue", icon: "✍️" },
  { href: "/app/documents", label: "Documents", icon: "📄" },
  { href: "/app/billing", label: "Billing", icon: "💳" },
  { href: "/app/team", label: "Team", icon: "👥" },
  { href: "/app/referrals", label: "Referrals", icon: "💸" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({
  wsName,
  plan,
  userEmail,
  initialUnread,
}: {
  wsName: string;
  plan: string;
  userEmail: string;
  initialUnread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [bellOpen, setBellOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openBell() {
    const next = !bellOpen;
    setBellOpen(next);
    if (next) {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = (await res.json()) as { items: NotificationDTO[]; unread: number };
        setItems(data.items);
        setUnread(data.unread);
      }
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  const nav = (
    <nav className="space-y-1">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(n.href)
              ? "bg-emerald-500/10 text-emerald-500"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <span>{n.icon}</span> {n.label}
        </Link>
      ))}
    </nav>
  );

  const planBadge = (
    <div className="rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800">
      <div className="truncate font-bold">{wsName}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">{plan}</span>
        {plan !== "SCALE" && plan !== "ENTERPRISE" && (
          <Link href="/app/billing" className="font-semibold text-emerald-500 hover:underline">
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-white p-4 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/app" className="mb-6 flex items-center gap-2 font-black tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950">C</span>
          CrewOS
        </Link>
        {nav}
        <div className="mt-auto space-y-3">
          {planBadge}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="truncate">{userEmail}</span>
            <button onClick={logout} className="font-semibold hover:text-red-500">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center justify-between p-3">
          <Link href="/app" className="flex items-center gap-2 font-black">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-xs text-emerald-950">C</span>
            CrewOS
          </Link>
          <button onClick={logout} className="text-xs font-semibold text-zinc-500">
            Sign out
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isActive(n.href) ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500"
              }`}
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Notification bell (floating) */}
      <div ref={bellRef} className="no-print fixed right-4 top-4 z-40 hidden lg:block">
        <button
          onClick={openBell}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          aria-label="Notifications"
        >
          🔔
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-emerald-950">
              {unread}
            </span>
          )}
        </button>
        {bellOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-emerald-500 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">Nothing yet.</p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg p-2.5 text-sm ${n.readAt ? "text-zinc-500" : "bg-emerald-500/5 font-medium"}`}
                  >
                    <div>{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs font-normal text-zinc-500">{n.body}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
