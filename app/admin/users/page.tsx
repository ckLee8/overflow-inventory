import { prisma } from "@/lib/prisma";
import { createUser, deactivateUser, updateUser } from "@/lib/actions/admin";
import { Button, Card, Input, Label, PageHead, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-8">
      <PageHead kicker="Access · accounts" title="Users">
        Only admins create accounts. Roles: ADMIN (full), MANAGER (inventory/ordering/approvals),
        STAFF (grid/stock view).
      </PageHead>

      <Card className="p-5">
        <h2 className="font-display text-xl font-medium tracking-tight">Create user</h2>
        <form action={createUser} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <Input name="name" required />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <Input name="email" type="email" required />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <Input name="password" type="password" required minLength={8} />
          </Label>
          <Label>
            <span className="text-xs font-medium text-muted-foreground">Role</span>
            <Select name="role" defaultValue="STAFF">
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="STAFF">STAFF</option>
            </Select>
          </Label>
          <div className="sm:col-span-2">
            <Button type="submit">Create user</Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight">Existing users</h2>
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <form action={updateUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="hidden" name="id" value={user.id} />
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <Input name="name" defaultValue={user.name} required />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <Input name="email" type="email" defaultValue={user.email} required />
              </Label>
              <Label>
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <Select name="role" defaultValue={user.role}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="STAFF">STAFF</option>
                </Select>
              </Label>
              <Label className="sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Reset password (optional)</span>
                <Input name="password" type="password" minLength={8} placeholder="Leave blank to keep" />
              </Label>
              <label className="flex min-h-11 items-center gap-2 pt-6">
                <input type="checkbox" name="active" value="true" defaultChecked={user.active} className="h-5 w-5 accent-primary" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit">Save</Button>
              </div>
            </form>
            {user.active ? (
              <form action={deactivateUser} className="mt-2">
                <input type="hidden" name="id" value={user.id} />
                <Button type="submit" variant="secondary">
                  Deactivate
                </Button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-warn">Inactive</p>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
