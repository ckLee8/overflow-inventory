import { WeeklyOrderGrid } from "@/components/WeeklyOrderGrid";

export default function OrderingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly ordering</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter quantities per SKU × day. Group by vendor or store location. Closed vendor days are
          blocked.
        </p>
      </div>
      <WeeklyOrderGrid />
    </div>
  );
}
