import { prisma } from "@/lib/prisma";
import { createProduct, updateProduct } from "@/lib/actions/admin";
import { Button, Card, Input, Label, PageHead, Select } from "@/components/ui";

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
      <PageHead kicker="Catalog · SKUs" title="Products / SKUs">
        Create and edit catalog items; optionally link a preferred vendor.
      </PageHead>

      <Card className="p-5">
        <h2 className="font-display text-xl font-medium tracking-tight">Add product</h2>
        <form action={createProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Label>
            <span className="text-xs font-medium text-muted-foreground">SKU</span>
            <Input name="sku" required className="font-mono" />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input name="name" required />
          </Label>
          <Label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input name="description" />
          </Label>
          <Label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Vendor</span>
            <Select name="vendorId" defaultValue="">
              <option value="">— none —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Label>
          <div>
            <Button type="submit">Create product</Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight">Catalog</h2>
        {products.map((product) => (
          <form key={product.id} action={updateProduct}>
            <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <input type="hidden" name="id" value={product.id} />
              <Label>
                <span className="text-xs font-medium text-muted-foreground">SKU</span>
                <Input name="sku" defaultValue={product.sku} required className="font-mono" />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <Input name="name" defaultValue={product.name} required />
              </Label>
              <Label className="sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">Vendor</span>
                <Select name="vendorId" defaultValue={product.vendorId ?? ""}>
                  <option value="">— none —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </Label>
              <Label className="sm:col-span-2 lg:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <Input name="description" defaultValue={product.description ?? ""} />
              </Label>
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name="active" value="true" defaultChecked={product.active} className="h-5 w-5 accent-primary" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit">Save</Button>
              </div>
            </Card>
          </form>
        ))}
      </section>
    </div>
  );
}
