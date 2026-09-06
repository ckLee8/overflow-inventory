export default function ApprovalsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Per-day approval placeholder. Approving a day will split lines by vendor and call the
          matching adapter.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No pending day approvals yet. Fill the weekly ordering grid, then approve a day here.
      </div>
    </div>
  );
}
