import { WeeklyOrderGrid } from "@/components/WeeklyOrderGrid";
import { getOrderingBundle } from "@/lib/data";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function OrderingPage() {
  const bundle = await getOrderingBundle();
  const todayDate = todayDateString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly ordering</h1>
        <p className="mt-1 text-sm text-slate-600">
          Week of {bundle.weekStart}. Only <strong>today</strong> ({todayDate}, {APP_TIMEZONE})
          is editable — past and future day columns are locked. Closed vendor days stay blocked.
          {bundle.source === "db" && bundle.planId
            ? " Today’s edits save to WeeklyOrderPlan cells."
            : " Using mock data until DATABASE_URL is set."}
        </p>
      </div>
      <WeeklyOrderGrid
        planId={bundle.planId}
        columns={bundle.columns}
        rows={bundle.rows}
        vendors={bundle.vendors}
        source={bundle.source}
        todayDate={todayDate}
        timezone={APP_TIMEZONE}
      />
    </div>
  );
}
