import { mockOrderRows } from "@/lib/mock-data";

export default function ReportsPage() {
  const belowMin = mockOrderRows.filter((r) => r.onHand + r.onOrder < r.minLevel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Skeleton reports using mock data. Production reports will query Postgres via Prisma.
        </p>
      </div>
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
        Open POs and stock movement history will appear here once purchase orders and movements are
        persisted.
      </section>
    </div>
  );
}
