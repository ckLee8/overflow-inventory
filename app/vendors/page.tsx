import { getVendors } from "@/lib/data";

export const dynamic = "force-dynamic";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function VendorsPage() {
  const vendors = await getVendors();
  const source = vendors[0]?.source ?? "mock";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Vendors</h1>
        <p className="mt-1 text-sm text-slate-600">
          Schedules from {source === "db" ? "Postgres" : "mock data"}. Adapter stubs live under{" "}
          <code className="rounded bg-slate-100 px-1">lib/vendors/</code>: EmailPdfPoAdapter,
          ShopifyWholesaleAdapter, AmazonAdapter.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <article
            key={vendor.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{vendor.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Adapter: {vendor.adapterType}</p>
            {vendor.contactEmail ? (
              <p className="mt-1 text-sm text-slate-500">{vendor.contactEmail}</p>
            ) : null}
            <p className="mt-3 text-sm text-slate-700">
              Order days:{" "}
              {vendor.orderDaysOfWeek.map((d) => dayNames[d]).join(", ") || "None"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
