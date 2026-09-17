import { DailyMinsPanel } from "@/components/DailyMinsPanel";
import { PageHead } from "@/components/ui";
import { getBusinessClock } from "@/lib/clock";
import { getDailyMinRows } from "@/lib/data";
import { weekdayUtc } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function AdminMinimumsPage() {
  const [rows, clock] = await Promise.all([getDailyMinRows(), getBusinessClock()]);

  return (
    <div>
      <PageHead kicker="Catalog · weekday mins" title="Daily minimums">
        Set the min on-hand for each SKU × location × weekday. Inventory, reports, and the
        order grid use <strong className="font-medium text-foreground">today’s</strong> min
        (including the test clock). Empty days start from the catalog default min.
      </PageHead>
      <DailyMinsPanel rows={rows} todayDayOfWeek={weekdayUtc(clock.today)} />
    </div>
  );
}
