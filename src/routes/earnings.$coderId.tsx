import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMISSION_RATE, earnings, type EarningsRow } from "@/data/workspaces";
import { getCoder, type Coder } from "@/data/coders";

export const Route = createFileRoute("/earnings/$coderId")({
  loader: ({ params }): { coder: Coder; rows: EarningsRow[] } => {
    const coder = getCoder(params.coderId);
    if (!coder) throw notFound();
    return { coder, rows: earnings[params.coderId] ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Earnings · ${loaderData.coder.name} — Akda` }] : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold">No earnings data</h1>
        <Link to="/coders" className="mt-6 inline-block text-akda hover:underline">Back to coders</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-muted-foreground">{error.message}</div>
    </div>
  ),
  component: EarningsPage,
});

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function EarningsPage() {
  const { coder, rows } = Route.useLoaderData() as { coder: Coder; rows: EarningsRow[] };

  const released = rows.filter((r) => r.status === "released");
  const inEscrow = rows.filter((r) => r.status === "in-escrow");

  const grossReleased = released.reduce((s, r) => s + r.gross, 0);
  const commissionReleased = grossReleased * COMMISSION_RATE;
  const netReleased = grossReleased - commissionReleased;

  const grossEscrow = inEscrow.reduce((s, r) => s + r.gross, 0);
  const commissionEscrow = grossEscrow * COMMISSION_RATE;
  const netEscrow = grossEscrow - commissionEscrow;

  const totalGross = grossReleased + grossEscrow;
  const totalCommission = commissionReleased + commissionEscrow;
  const totalNet = netReleased + netEscrow;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/coders/$coderId" params={{ coderId: coder.id }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-akda">Earnings · {coder.name}</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">${fmt(totalNet)}</h1>
          <p className="text-sm text-muted-foreground">
            Net lifetime payouts after Akda's <span className="text-foreground">10% commission</span>.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {[
            { icon: TrendingUp, label: "Gross billed", value: `$${fmt(totalGross)}`, sub: `${rows.length} projects` },
            { icon: DollarSign, label: "Akda commission · 10%", value: `−$${fmt(totalCommission)}`, sub: "Auto-deducted on release" },
            { icon: Wallet, label: "Net to you", value: `$${fmt(totalNet)}`, sub: `$${fmt(netEscrow)} pending in escrow` },
          ].map((s) => (
            <div key={s.label} className="bg-card p-6">
              <s.icon className="h-4 w-4 text-akda" />
              <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Commission visual */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-akda">Per-dollar split</p>
            <p className="font-mono text-[10px] text-muted-foreground">10% / 90%</p>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full border border-border bg-surface">
            <div className="h-full bg-gradient-akda" style={{ width: "10%" }} />
            <div className="h-full bg-status-open/70" style={{ width: "90%" }} />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-akda align-middle" />Akda fee</span>
            <span>Coder payout<span className="ml-1 inline-block h-2 w-2 rounded-full bg-status-open/70 align-middle" /></span>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-akda">Transactions</p>
            <p className="font-mono text-[10px] text-muted-foreground">{rows.length} entries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Fee · 10%</th>
                  <th className="px-6 py-3 text-right">Net</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const fee = r.gross * COMMISSION_RATE;
                  const net = r.gross - fee;
                  const statusStyle = r.status === "released"
                    ? "border-status-open/30 bg-status-open/10 text-status-open"
                    : r.status === "in-escrow"
                      ? "border-status-working/30 bg-status-working/10 text-status-working"
                      : "border-border bg-surface text-muted-foreground";
                  return (
                    <tr key={r.workspaceId} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-6 py-4">
                        <p className="font-medium">{r.project}</p>
                        <p className="text-xs text-muted-foreground">{r.customer} · {r.date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusStyle}`}>
                          {r.status === "in-escrow" ? "In escrow" : r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">${fmt(r.gross)}</td>
                      <td className="px-6 py-4 text-right font-mono text-akda">−${fmt(fee)}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold">${fmt(net)}</td>
                      <td className="px-6 py-4 text-right">
                        {r.workspaceId.startsWith("ws-") && (
                          <Link to="/workspaces/$workspaceId" params={{ workspaceId: r.workspaceId }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-akda">
                            Open <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
