import { prisma } from "@/lib/prisma";
import { createLocation, updateLocation } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const locations = await prisma.storeLocation.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Store locations</h1>
        <p className="mt-1 text-sm text-slate-600">Locations used for stock levels, ordering, and receiving.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add location</h2>
        <form action={createLocation} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Code</span>
            <input name="code" required placeholder="MAIN" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required placeholder="Main Floor" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <div>
            <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create location
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Locations</h2>
        {locations.map((loc) => (
          <form
            key={loc.id}
            action={updateLocation}
            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"
          >
            <input type="hidden" name="id" value={loc.id} />
            <label className="block space-y-1">
              <span className="text-sm font-medium">Code</span>
              <input name="code" defaultValue={loc.code} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Name</span>
              <input name="name" defaultValue={loc.name} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="flex min-h-11 items-center gap-2 pt-6">
              <input type="checkbox" name="active" value="true" defaultChecked={loc.active} className="h-5 w-5" />
              <span className="text-sm font-medium">Active</span>
            </label>
            <div className="sm:col-span-3">
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
