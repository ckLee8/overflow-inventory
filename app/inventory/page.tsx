import { InventoryRowActions } from "@/components/InventoryRowActions";
import { OnHandEditor } from "@/components/OnHandEditor";
import { auth } from "@/lib/auth";
import { getInventoryRows, type InboundLineBadge } from "@/lib/data";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Primary inbound line for a SKU×location row: prefer open SHIPPED over ORDERED;
 * if none open, fall back to a fully received line (checked and reversible).
 */
function pickPrimaryInbound(lines: InboundLineBadge[]): InboundLineBadge | null {
  const open = lines.filter((l) => l.remaining > 0);
  if (open.length > 0) {
    const shipped = open.filter((l) => l.fulfillmentStatus === "SHIPPED");
    const ordered = open.filter((l) => l.fulfillmentStatus === "ORDERED");
    return shipped[0] ?? ordered[0] ?? open[0];
  }
  const received = lines.filter(
    (l) => l.remaining <= 0 && (l.receivedQty > 0 || l.fulfillmentStatus === "RECEIVED"),
  );
  return received[0] ?? null;
}

export default async function InventoryPage() {
  const [rows, session] = await Promise.all([getInventoryRows(), auth()]);
  const source = rows[0]?.source ?? "mock";
  const todayDate = todayDateString();
  const role = session?.user?.role;
  const canEditStock = role === "ADMIN" || role === "MANAGER";
  const canReceive = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          One row per SKU × location
          {source === "db" ? " from Postgres (Prisma)." : " (mock fallback — set DATABASE_URL)."}{" "}
          On hand is <strong>today&apos;s count</strong> ({todayDate}, {APP_TIMEZONE})
          {canEditStock
            ? " — ADMIN/MANAGER can edit; saves an ADJUST movement."
            : " — view only for STAFF."}{" "}
          Expected is read-only (on-order). Receive is a two-way checkbox (check remaining; uncheck to reverse)
          {canReceive ? " for ADMIN/MANAGER;" : " (STAFF view-only);"} flag icon marks a
          delivery issue. Rows with remaining inbound are highlighted.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-3 font-semibold">SKU</th>
              <th className="px-3 py-3 font-semibold">Location</th>
              <th className="px-3 py-3 font-semibold">
                On hand
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  today ({todayDate.slice(5)})
                </span>
              </th>
              <th className="px-3 py-3 font-semibold">Min</th>
              <th className="px-3 py-3 font-semibold">Expected</th>
              <th className="px-3 py-3 font-semibold">Receive</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No stock levels yet. Run seed.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const below = row.onHand + row.onOrder < row.minLevel;
                const inbound = row.inboundLines ?? [];
                const primary = pickPrimaryInbound(inbound);
                const hasRemaining = Boolean(primary && primary.remaining > 0);
                return (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-100 ${
                      hasRemaining ? "bg-sky-50/70" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{row.sku}</div>
                      <div className="text-xs text-slate-500">{row.name}</div>
                    </td>
                    <td className="px-3 py-3">{row.locationName}</td>
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
                    <td className="px-3 py-3">{row.minLevel}</td>
                    <td className="px-3 py-3">{row.onOrder}</td>
                    <InventoryRowActions
                      key={primary?.lineId ?? row.id}
                      primary={primary}
                      canReceive={canReceive}
                      source={row.source}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
