import { prisma } from "@/lib/prisma";
import { createLocation, updateLocation } from "@/lib/actions/admin";
import { Button, Card, Input, Label, PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const locations = await prisma.storeLocation.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-8">
      <PageHead kicker="Floor · stock locations" title="Store locations">
        Locations used for stock levels, ordering, and receiving.
      </PageHead>

      <Card className="p-5">
        <h2 className="font-display text-xl font-medium tracking-tight">Add location</h2>
        <form action={createLocation} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Code</span>
            <Input name="code" required placeholder="MAIN" className="font-mono" />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input name="name" required placeholder="Main Floor" />
          </Label>
          <div>
            <Button type="submit">Create location</Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight">Locations</h2>
        {locations.map((loc) => (
          <form key={loc.id} action={updateLocation}>
            <Card className="grid gap-3 p-4 sm:grid-cols-3">
              <input type="hidden" name="id" value={loc.id} />
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Code</span>
                <Input name="code" defaultValue={loc.code} required className="font-mono" />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <Input name="name" defaultValue={loc.name} required />
              </Label>
              <label className="flex min-h-11 items-center gap-2 pt-6">
                <input type="checkbox" name="active" value="true" defaultChecked={loc.active} className="h-5 w-5 accent-primary" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="sm:col-span-3">
                <Button type="submit">Save</Button>
              </div>
            </Card>
          </form>
        ))}
      </section>
    </div>
  );
}
