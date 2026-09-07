import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getReferralOverview } from "@/lib/referrals";
import { fmtUsd, fmtDate } from "@/lib/format";
import { Card } from "@/components/ui";
import { ReferralLink } from "@/components/referral-link";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { referralCode, creditCents, ledger } = await getReferralOverview(session.wsId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Referrals</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Give $500 of value, get $100. You earn a <strong>$100 account credit</strong> every time a workspace you referred pays for their first month.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Your referral link</h2>
        <ReferralLink code={referralCode} />
        <p className="mt-3 text-xs text-zinc-500">
          Share it with founders who are still doing $12/hour work with $120/hour people. Credits apply automatically at renewal.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Credit balance</h2>
          <span className="text-2xl font-black text-emerald-500">{fmtUsd(creditCents)}</span>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-3"><h2 className="font-bold">Referral history</h2></div>
        {ledger.length === 0 ? (
          <p className="p-5 pt-0 text-sm text-zinc-500">No referrals yet — your link is above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3 text-zinc-500">{fmtDate(l.createdAt)}</td>
                  <td className="px-5 py-3">{l.note ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-500">{fmtUsd(l.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
