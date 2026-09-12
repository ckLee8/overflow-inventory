import { Card, PageHead } from "@/components/ui";
import { getBelowMinRows, getOnHandSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [belowMin, summary] = await Promise.all([getBelowMinRows(), getOnHandSummary()]);

  return (
    <div>
      <PageHead kicker="Watch · on-hand" title="Reports">
        On-hand and below-min from {summary.source === "db" ? "Postgres" : "mock data"}.
      </PageHead>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            SKU × location
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums tracking-tight">{summary.totalSkus}</p>
        </Card>
        <Card className="px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Total on hand
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums tracking-tight">{summary.totalOnHand}</p>
        </Card>
        <Card className="px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Below min
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums tracking-tight text-warn">{summary.belowMin}</p>
        </Card>
      </section>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-xl font-medium tracking-tight">Below minimum</h2>
        {belowMin.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">All SKUs are at or above min level.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {belowMin.map((row) => (
              <li key={row.id} className="flex justify-between gap-4 py-2.5">
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{row.sku}</span>
                  <span className="ml-2 text-muted-foreground">· {row.locationName}</span>
                </span>
                <span className="tabular-nums text-warn">
                  {row.onHand + row.onOrder}
                  <span className="text-muted-foreground"> / min {row.minLevel}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="mt-4 border-dashed p-5 text-sm text-muted-foreground">
        Open POs and stock movement history will appear here once purchase-order workflows write
        movements.
      </Card>
    </div>
  );
}
