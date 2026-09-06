import { ReceivingForm } from "@/components/ReceivingForm";
import { auth } from "@/lib/auth";
import { getReceivablePurchaseOrders } from "@/lib/data";
import { hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReceivingPage() {
  const db = hasDatabase();
  const [pos, session] = await Promise.all([getReceivablePurchaseOrders(), auth()]);
  const role = session?.user?.role;
  const canReceive = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Receiving</h1>
        <p className="mt-1 text-sm text-slate-600">
          Receive full or partial shipments against open purchase orders (APPROVED, SUBMITTED, or
          PARTIAL). Stock on-hand increases at the PO&apos;s store location; on-order decreases;
          each receive writes a RECEIVE stock movement.
        </p>
      </div>

      {!canReceive ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You can view open POs, but receiving is limited to MANAGER and ADMIN roles.
        </div>
      ) : null}

      {!db ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Set DATABASE_URL and run seed to list receivable POs.
        </div>
      ) : pos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No open POs to receive. Seed includes an APPROVED and SUBMITTED PO for demo.
        </div>
      ) : (
        <div className="space-y-6">
          {pos.map((po) => (
            <ReceivingForm key={po.id} po={po} canReceive={canReceive} />
          ))}
        </div>
      )}
    </div>
  );
}
