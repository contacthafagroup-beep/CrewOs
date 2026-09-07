import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme";
import { demoEnabled } from "@/lib/auth/session";
import { oauthProviderConfigured } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-black tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950">C</span>
        CrewOS
      </Link>
      <AuthPanel
        mode="signup"
        demoEnabled={demoEnabled()}
        oauthGoogle={oauthProviderConfigured("google")}
        oauthMicrosoft={oauthProviderConfigured("microsoft")}
        error={error}
      />
      <div className="mt-6 text-sm text-zinc-500">
        Already have a workspace?{" "}
        <Link href="/login" className="font-semibold text-emerald-500">
          Sign in
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
    </main>
  );
}
