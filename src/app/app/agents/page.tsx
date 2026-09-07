import Link from "next/link";
import { AGENT_SPECS } from "@/lib/agents/registry";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Your AI employees</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Each one is a specialist. Give them a brief, watch them work, approve the output.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {AGENT_SPECS.map((spec) => (
          <Card key={spec.id}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">{spec.icon}</div>
            <h2 className="mt-4 font-bold">{spec.name}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{spec.description}</p>
            <div className="mt-3 text-xs text-zinc-500">{spec.inputs.length} inputs · {spec.steps.length} steps · {spec.tier} model tier</div>
            <Link
              href={`/app/agents/${spec.id}`}
              className="mt-4 block rounded-lg bg-emerald-500 py-2 text-center text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
            >
              Run {spec.name}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
