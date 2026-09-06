import { OnHandEditor } from "@/components/OnHandEditor";
import { ReceivingForm } from "@/components/ReceivingForm";
import { auth } from "@/lib/auth";
import { getInventoryRows, getReceivablePurchaseOrders } from "@/lib/data";
import { hasDatabase } from "@/lib/db";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function fulfillmentTone(status: string) {
  if (status === "RECEIVED") return "bg-emerald-50 text-emerald-800";
  if (status === "SHIPPED") return "bg-sky-50 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

export default async function InventoryPage() {
  const db = hasDatabase();
  const [rows, pos, session] = await Promise.all([
    getInventoryRows(),
    getReceivablePurchaseOrders(),
    auth(),
  ]);
  const source = rows[0]?.source ?? "mock";
  const todayDate = todayDateString();
  const role = session?.user?.role;
  const canEditStock = role === "ADMIN" || role === "MANAGER";
  const canReceive = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Products and stock by location
          {source === "db" ? " from Postgres (Prisma)." : " (mock fallback — set DATABASE_URL)."}{" "}
          On hand is <strong>today&apos;s count</strong> ({todayDate}, {APP_TIMEZONE})
          {canEditStock
            ? " — ADMIN/MANAGER can edit; saves an ADJUST movement."
            : " — view only for STAFF."}{" "}
          Confirm deliveries in the{" "}
          <a href="#receiving" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            receiving
          </a>{" "}
          section below while counting stock.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-3 font-semibold">SKU</th>
              <th className="px-3 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Location</th>
              <th className="px-3 py-3 font-semibold">Vendor</th>
              <th className="px-3 py-3 font-semibold">
                On hand
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  today ({todayDate.slice(5)})
                </span>
              </th>
              <th className="px-3 py-3 font-semibold">On order</th>
              <th className="px-3 py-3 font-semibold">Inbound</th>
              <th className="px-3 py-3 font-semibold">Min</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No stock levels yet. Run seed.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const below = row.onHand + row.onOrder < row.minLevel;
                const inbound = row.inboundLines ?? [];
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.sku}</td>
                    <td className="px-3 py-3">{row.name}</td>
                    <td className="px-3 py-3">{row.locationName}</td>
                    <td className="px-3 py-3">{row.vendorName}</td>
                    <td className="px-3 py-3">
                      <OnHandEditor
                        stockLevelId={row.id}
                        initialOnHand={row.onHand}
                        canEdit={canEditStock}
                        source={row.source}
                        todayDate={todayDate}
                        timezone={APP_TIMEZONE}
                        belowMin={below}
                      />
                    </td>
                    <td className="px-3 py-3">{row.onOrder}</td>
                    <td className="px-3 py-3">
                      {inbound.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {inbound.map((line) => (
                            <span
                              key={line.lineId}
                              title={`PO ${line.poId}: ${line.receivedQty}/${line.quantity} received, ${line.remaining} remaining`}
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${fulfillmentTone(line.fulfillmentStatus)}`}
                            >
                              {line.fulfillmentStatus}
                              <span className="ml-1 font-normal opacity-80">
                                {line.remaining} left
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">{row.minLevel}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <section id="receiving" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Receiving</h2>
          <p className="mt-1 text-sm text-slate-600">
            Receive full or partial shipments against open purchase orders (APPROVED, SUBMITTED, or
            PARTIAL). Mark lines <strong>SHIPPED</strong> when the vendor ships (before stock
            arrives). Receiving increases on-hand at the PO&apos;s location, decreases on-order, and
            writes a RECEIVE movement. Fully received lines become <strong>RECEIVED</strong>.
          </p>
        </div>

        {!canReceive ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You can view open POs and inbound badges, but receiving / marking shipped is limited to
            MANAGER and ADMIN roles.
          </div>
        ) : null}

        {!db ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Set DATABASE_URL and run seed to list receivable POs.
          </div>
        ) : pos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No open POs to receive. Seed includes APPROVED (ORDERED) and SUBMITTED (SHIPPED) lines
            for demo.
          </div>
        ) : (
          <div className="space-y-6">
            {pos.map((po) => (
              <ReceivingForm key={po.id} po={po} canReceive={canReceive} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
