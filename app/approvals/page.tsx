import { getPendingPurchaseOrders } from "@/lib/data";
import { hasDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const db = hasDatabase();
  const pos = await getPendingPurchaseOrders();
  const session = await auth();
  const canApprove =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Draft and approved purchase orders from the database. Day-plan approval that splits lines
          by vendor and calls adapters is next.
        </p>
      </div>

      {!canApprove ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You can view pending orders, but approving is limited to MANAGER and ADMIN roles.
        </div>
      ) : null}

      {!db ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Set DATABASE_URL and seed to list pending POs. Until then this page is a stub.
        </div>
      ) : pos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No draft/approved purchase orders. Seed data includes sample POs.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Vendor</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Order date</th>
                <th className="px-3 py-3 font-semibold">Lines</th>
                <th className="px-3 py-3 font-semibold">Notes</th>
                {canApprove ? <th className="px-3 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        po.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium">{po.vendorName}</td>
                  <td className="px-3 py-3">{po.storeLocationName ?? "—"}</td>
                  <td className="px-3 py-3">{po.orderDate}</td>
                  <td className="px-3 py-3">{po.lineCount}</td>
                  <td className="px-3 py-3 text-slate-500">{po.notes ?? "—"}</td>
                  {canApprove ? (
                    <td className="px-3 py-3 text-slate-400">Approve (soon)</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
