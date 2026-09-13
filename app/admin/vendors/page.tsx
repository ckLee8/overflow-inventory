import { prisma } from "@/lib/prisma";
import { createVendor, updateVendor } from "@/lib/actions/admin";
import { Button, Card, Input, Label, PageHead, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatDays(days: number[]): string {
  return days.join(",");
}

function formatBlackouts(dates: Date[]): string {
  return dates.map((d) => d.toISOString().slice(0, 10)).join(",");
}

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <PageHead kicker="Adapters · schedule" title="Vendors">
        Order days are 0=Sun … 6=Sat (comma-separated). Blackouts are YYYY-MM-DD dates.
      </PageHead>

      <Card className="p-5">
        <h2 className="font-display text-xl font-medium tracking-tight">Add vendor</h2>
        <form action={createVendor} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input name="name" required />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Adapter type</span>
            <Select name="adapterType" defaultValue="email_pdf">
              <option value="email_pdf">email_pdf</option>
              <option value="shopify_wholesale">shopify_wholesale</option>
              <option value="amazon">amazon</option>
            </Select>
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Contact email</span>
            <Input name="contactEmail" type="email" />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Order days (e.g. 1,2,3,4,5)</span>
            <Input name="orderDaysOfWeek" placeholder="1,2,3,4,5" className="font-mono" />
          </Label>
          <Label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Blackout dates (YYYY-MM-DD,…)</span>
            <Input name="blackoutDates" placeholder="2026-12-25,2026-01-01" className="font-mono" />
          </Label>
          <div>
            <Button type="submit">Create vendor</Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight">Vendors</h2>
        {vendors.map((vendor) => (
          <form key={vendor.id} action={updateVendor}>
            <Card className="grid gap-3 p-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={vendor.id} />
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <Input name="name" defaultValue={vendor.name} required />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Adapter type</span>
                <Select name="adapterType" defaultValue={vendor.adapterType}>
                  <option value="email_pdf">email_pdf</option>
                  <option value="shopify_wholesale">shopify_wholesale</option>
                  <option value="amazon">amazon</option>
                </Select>
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Contact email</span>
                <Input name="contactEmail" type="email" defaultValue={vendor.contactEmail ?? ""} />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Order days</span>
                <Input name="orderDaysOfWeek" defaultValue={formatDays(vendor.orderDaysOfWeek)} className="font-mono" />
              </Label>
              <Label className="sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Blackout dates</span>
                <Input name="blackoutDates" defaultValue={formatBlackouts(vendor.blackoutDates)} className="font-mono" />
              </Label>
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name="active" value="true" defaultChecked={vendor.active} className="h-5 w-5 accent-primary" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Save</Button>
              </div>
            </Card>
          </form>
        ))}
      </section>
    </div>
  );
}
