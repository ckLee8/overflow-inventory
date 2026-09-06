import { InventoryRowActions } from "@/components/InventoryRowActions";
import { OnHandEditor } from "@/components/OnHandEditor";
import { auth } from "@/lib/auth";
import { getInventoryRows, type InboundLineBadge } from "@/lib/data";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Primary open inbound line for a SKU×location row: prefer SHIPPED over ORDERED
 * so staff receive against what's already in transit. Extra open lines are noted
 * as "+N" beside the inbound badge (clearest single-row UX vs a nested control).
 */
function pickPrimaryInbound(lines: InboundLineBadge[]): {
  primary: InboundLineBadge | null;
  extraCount: number;
} {
  const open = lines.filter((l) => l.remaining > 0);
  if (open.length === 0) return { primary: null, extraCount: 0 };
  const shipped = open.filter((l) => l.fulfillmentStatus === "SHIPPED");
  const ordered = open.filter((l) => l.fulfillmentStatus === "ORDERED");
  const primary = shipped[0] ?? ordered[0] ?? open[0];
  return { primary, extraCount: open.length - 1 };
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
          Receive and mark-ship are in-row
          {canReceive ? " for ADMIN/MANAGER." : " (STAFF view-only)."} Rows with remaining
          inbound are highlighted.
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
              <th className="px-3 py-3 font-semibold">On order</th>
              <th className="px-3 py-3 font-semibold">Inbound</th>
              <th className="px-3 py-3 font-semibold">Receive</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
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
                const { primary, extraCount } = pickPrimaryInbound(inbound);
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
                      primary={primary}
                      extraCount={extraCount}
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
