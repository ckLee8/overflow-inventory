import { Badge, Card, PageHead } from "@/components/ui";
import { getVendors } from "@/lib/data";

export const dynamic = "force-dynamic";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function VendorsPage() {
  const vendors = await getVendors();
  const source = vendors[0]?.source ?? "mock";

  return (
    <div>
      <PageHead kicker="Schedule · adapters" title="Vendors">
        Schedules from {source === "db" ? "Postgres" : "mock data"}. Adapter stubs live under{" "}
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">lib/vendors/</code>:
        EmailPdfPoAdapter, ShopifyWholesaleAdapter, AmazonAdapter.
      </PageHead>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
                {vendor.name}
              </h2>
              <Badge tone="primary">{vendor.adapterType.replaceAll("_", " ")}</Badge>
            </div>
            {vendor.contactEmail ? (
              <p className="mt-1 text-sm text-muted-foreground">{vendor.contactEmail}</p>
            ) : null}
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Order days
            </p>
            <p className="mt-1 text-sm text-foreground">
              {vendor.orderDaysOfWeek.map((d) => dayNames[d]).join(", ") || "None"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
