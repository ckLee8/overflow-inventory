import { prisma } from "@/lib/prisma";
import { createProduct, updateProduct } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, vendors] = await Promise.all([
    prisma.product.findMany({
      include: { vendor: true },
      orderBy: { sku: "asc" },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Products / SKUs</h1>
        <p className="mt-1 text-sm text-slate-600">Create and edit catalog items; optionally link a preferred vendor.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add product</h2>
        <form action={createProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">SKU</span>
            <input name="sku" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Description</span>
            <input name="description" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Vendor</span>
            <select name="vendorId" defaultValue="" className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
              <option value="">— none —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create product
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Catalog</h2>
        {products.map((product) => (
          <form
            key={product.id}
            action={updateProduct}
            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="id" value={product.id} />
            <label className="block space-y-1">
              <span className="text-sm font-medium">SKU</span>
              <input name="sku" defaultValue={product.sku} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Name</span>
              <input name="name" defaultValue={product.name} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="block space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-sm font-medium">Vendor</span>
              <select name="vendorId" defaultValue={product.vendorId ?? ""} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                <option value="">— none —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 sm:col-span-2 lg:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <input name="description" defaultValue={product.description ?? ""} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="active" value="true" defaultChecked={product.active} className="h-5 w-5" />
              <span className="text-sm font-medium">Active</span>
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
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
