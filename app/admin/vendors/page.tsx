import { prisma } from "@/lib/prisma";
import { createVendor, updateVendor } from "@/lib/actions/admin";

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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Vendors</h1>
        <p className="mt-1 text-sm text-slate-600">
          Order days are 0=Sun … 6=Sat (comma-separated). Blackouts are YYYY-MM-DD dates.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add vendor</h2>
        <form action={createVendor} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Adapter type</span>
            <select name="adapterType" defaultValue="email_pdf" className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
              <option value="email_pdf">email_pdf</option>
              <option value="shopify_wholesale">shopify_wholesale</option>
              <option value="amazon">amazon</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Contact email</span>
            <input name="contactEmail" type="email" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Order days (e.g. 1,2,3,4,5)</span>
            <input name="orderDaysOfWeek" placeholder="1,2,3,4,5" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Blackout dates (YYYY-MM-DD,…)</span>
            <input name="blackoutDates" placeholder="2026-12-25,2026-01-01" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <div>
            <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create vendor
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vendors</h2>
        {vendors.map((vendor) => (
          <form
            key={vendor.id}
            action={updateVendor}
            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={vendor.id} />
            <label className="block space-y-1">
              <span className="text-sm font-medium">Name</span>
              <input name="name" defaultValue={vendor.name} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Adapter type</span>
              <select name="adapterType" defaultValue={vendor.adapterType} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                <option value="email_pdf">email_pdf</option>
                <option value="shopify_wholesale">shopify_wholesale</option>
                <option value="amazon">amazon</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Contact email</span>
              <input name="contactEmail" type="email" defaultValue={vendor.contactEmail ?? ""} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Order days</span>
              <input name="orderDaysOfWeek" defaultValue={formatDays(vendor.orderDaysOfWeek)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Blackout dates</span>
              <input name="blackoutDates" defaultValue={formatBlackouts(vendor.blackoutDates)} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="active" value="true" defaultChecked={vendor.active} className="h-5 w-5" />
              <span className="text-sm font-medium">Active</span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Save
              </button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
