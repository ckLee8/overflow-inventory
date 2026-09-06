import { getInventoryRows } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await getInventoryRows();
  const source = rows[0]?.source ?? "mock";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Products and stock by location
          {source === "db" ? " from Postgres (Prisma)." : " (mock fallback — set DATABASE_URL)."}
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
              <th className="px-3 py-3 font-semibold">On hand</th>
              <th className="px-3 py-3 font-semibold">On order</th>
              <th className="px-3 py-3 font-semibold">Min</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No stock levels yet. Run <code className="rounded bg-slate-100 px-1">npm run prisma:seed</code>.
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
                    <td className={`px-3 py-3 ${below ? "font-semibold text-amber-700" : ""}`}>
                      {row.onHand}
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
