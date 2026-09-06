import { getBelowMinRows, getOnHandSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [belowMin, summary] = await Promise.all([getBelowMinRows(), getOnHandSummary()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          On-hand and below-min from {summary.source === "db" ? "Postgres" : "mock data"}.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU x location</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalSkus}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total on hand</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalOnHand}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Below min</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{summary.belowMin}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Below minimum</h2>
        {belowMin.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">All SKUs are at or above min level.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {belowMin.map((row) => (
              <li key={row.id} className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <span>
                  {row.sku} · {row.locationName}
                </span>
                <span className="text-amber-700">
                  {row.onHand + row.onOrder} / min {row.minLevel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        Open POs and stock movement history will appear here once purchase-order workflows write
        movements.
      </section>
    </div>
  );
}
