import { WeeklyOrderGrid } from "@/components/WeeklyOrderGrid";
import { getOrderingBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OrderingPage() {
  const bundle = await getOrderingBundle();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly ordering</h1>
        <p className="mt-1 text-sm text-slate-600">
          Week of {bundle.weekStart}. Enter quantities per SKU × day. Group by vendor or store
          location. Closed vendor days are blocked.
          {bundle.source === "db" && bundle.planId
            ? " Edits save to WeeklyOrderPlan cells."
            : " Using mock data until DATABASE_URL is set."}
        </p>
      </div>
      <WeeklyOrderGrid
        planId={bundle.planId}
        columns={bundle.columns}
        rows={bundle.rows}
        vendors={bundle.vendors}
        source={bundle.source}
      />
    </div>
  );
}
