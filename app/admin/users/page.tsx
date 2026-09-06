import { prisma } from "@/lib/prisma";
import { createUser, deactivateUser, updateUser } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Only admins create accounts. Roles: ADMIN (full), MANAGER (inventory/ordering/approvals),
          STAFF (grid/stock view).
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create user</h2>
        <form action={createUser} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input name="email" type="email" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <input name="password" type="password" required minLength={8} className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Role</span>
            <select name="role" defaultValue="STAFF" className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create user
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Existing users</h2>
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <form action={updateUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="hidden" name="id" value={user.id} />
              <label className="block space-y-1">
                <span className="text-sm font-medium">Name</span>
                <input name="name" defaultValue={user.name} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Email</span>
                <input name="email" type="email" defaultValue={user.email} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Role</span>
                <select name="role" defaultValue={user.role} className="min-h-11 w-full rounded-lg border border-slate-300 px-3">
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="STAFF">STAFF</option>
                </select>
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-sm font-medium">Reset password (optional)</span>
                <input name="password" type="password" minLength={8} placeholder="Leave blank to keep" className="min-h-11 w-full rounded-lg border border-slate-300 px-3" />
              </label>
              <label className="flex min-h-11 items-center gap-2 pt-6">
                <input type="checkbox" name="active" value="true" defaultChecked={user.active} className="h-5 w-5" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <button type="submit" className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Save
                </button>
              </div>
            </form>
            {user.active ? (
              <form action={deactivateUser} className="mt-2">
                <input type="hidden" name="id" value={user.id} />
                <button type="submit" className="min-h-11 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  Deactivate
                </button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-amber-700">Inactive</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
