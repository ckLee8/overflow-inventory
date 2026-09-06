import { OnHandEditor } from "@/components/OnHandEditor";
import { auth } from "@/lib/auth";
import { getInventoryRows } from "@/lib/data";
import { APP_TIMEZONE, todayDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [rows, session] = await Promise.all([getInventoryRows(), auth()]);
  const source = rows[0]?.source ?? "mock";
  const todayDate = todayDateString();
  const role = session?.user?.role;
  const canEditStock = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Products and stock by location
          {source === "db" ? " from Postgres (Prisma)." : " (mock fallback — set DATABASE_URL)."}{" "}
          On hand is <strong>today&apos;s count</strong> ({todayDate}, {APP_TIMEZONE})
          {canEditStock
            ? " — ADMIN/MANAGER can edit; saves an ADJUST movement."
            : " — view only for STAFF."}
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
              <th className="px-3 py-3 font-semibold">Min</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No stock levels yet. Run seed.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const below = row.onHand + row.onOrder < row.minLevel;
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
                    <td className="px-3 py-3">{row.minLevel}</td>
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
