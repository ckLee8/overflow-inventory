import { PageHead } from "@/components/ui";
import { TestClockPanel } from "@/components/TestClockPanel";
import { getBusinessClock } from "@/lib/clock";

export const dynamic = "force-dynamic";

export default async function AdminClockPage() {
  const clock = await getBusinessClock();

  return (
    <div>
      <PageHead kicker="Test · calendar" title="Test clock">
        Pretend it is another day so you can unlock that column on the weekly grid, walk a
        week boundary, and try vendor closed days — without waiting for the calendar.
        This is a global override: everyone on the floor sees the simulated today until you
        reset it.
      </PageHead>
      <TestClockPanel clock={clock} />
    </div>
  );
}
