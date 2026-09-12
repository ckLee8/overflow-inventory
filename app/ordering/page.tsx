import { WeeklyOrderGrid } from "@/components/WeeklyOrderGrid";
import { PageHead } from "@/components/ui";
import { getOrderingBundle } from "@/lib/data";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function OrderingPage() {
  const bundle = await getOrderingBundle();
  const todayDate = todayDateString();

  return (
    <div>
      <PageHead kicker={`Week of ${bundle.weekStart}`} title="Weekly ordering">
        Only <strong className="font-medium text-foreground">today</strong> ({todayDate}, {APP_TIMEZONE})
        is editable — past and future columns stay locked. Closed vendor days stay blocked.
        {bundle.source === "db" && bundle.planId
          ? " Today’s edits save to WeeklyOrderPlan cells."
          : " Using mock data until DATABASE_URL is set."}
      </PageHead>
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
