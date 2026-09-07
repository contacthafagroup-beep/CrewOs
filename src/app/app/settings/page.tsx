import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { activeProviderId } from "@/lib/ai/router";
import { authEnabled, demoEnabled } from "@/lib/auth/session";
import { oauthProviderConfigured } from "@/lib/auth/oauth";
import { stripeEnabled } from "@/lib/stripe";
import { emailEnabled } from "@/lib/email";
import { workerInline } from "@/lib/queue";
import { Card, Badge } from "@/components/ui";
import { BrandForm } from "@/components/brand-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ws = await prisma.workspace.findUnique({ where: { id: session.wsId } });
  if (!ws) redirect("/login");

  const config: [string, boolean, string][] = [
    ["AI provider", activeProviderId() !== "mock", `active: ${activeProviderId()}${activeProviderId() === "mock" ? " (add a key for real generation)" : ""}`],
    ["Stripe billing", stripeEnabled(), stripeEnabled() ? "configured" : "checkout disabled until keys are added"],
    ["Email sending", emailEnabled(), emailEnabled() ? "Resend configured" : "emails log to console (add RESEND_API_KEY)"],
    ["OAuth: Google", oauthProviderConfigured("google"), "GOOGLE_CLIENT_ID/SECRET"],
    ["OAuth: Microsoft", oauthProviderConfigured("microsoft"), "MICROSOFT_CLIENT_ID/SECRET"],
    ["Hardened auth", authEnabled(), authEnabled() ? "real providers active" : "demo login available"],
    ["Background worker", workerInline(), workerInline() ? "inline (WORKER_INLINE=true)" : "external worker required"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Workspace branding and deployment configuration.</p>
      </div>

      {demoEnabled() && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-500">
          <strong>Demo mode is ON</strong> (DEMO_MODE≠false). Anyone can enter the demo workspace from the login page.
          Set <code className="rounded bg-black/10 px-1 dark:bg-white/10">DEMO_MODE=&quot;false&quot;</code> in production.
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-bold">Workspace branding</h2>
        <BrandForm
          initialBrandName={ws.brandName ?? ws.name}
          initialBrandColor={ws.brandColor}
          initialBrandLogoUrl={ws.brandLogoUrl ?? ""}
        />
      </Card>

      <Card>
        <h2 className="mb-4 font-bold">Deployment configuration</h2>
        <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          {config.map(([name, ok, note]) => (
            <li key={name} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-zinc-500">{note}</div>
              </div>
              <Badge tone={ok ? "green" : "yellow"}>{ok ? "READY" : "NOT SET"}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          All keys go in <code className="rounded bg-black/10 px-1 dark:bg-white/10">.env</code> — see{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">.env.example</code> and DEPLOYMENT.md.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 font-bold">Workspace</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500">Name</dt>
          <dd className="font-semibold">{ws.name}</dd>
          <dt className="text-zinc-500">Slug</dt>
          <dd className="font-mono text-xs">{ws.slug}</dd>
          <dt className="text-zinc-500">Referral code</dt>
          <dd className="font-mono text-xs">{ws.referralCode}</dd>
        </dl>
      </Card>
    </div>
  );
}
