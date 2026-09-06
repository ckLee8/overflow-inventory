import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const cards = [
  {
    href: "/admin/users",
    title: "Users",
    body: "Create accounts, set roles (ADMIN / MANAGER / STAFF), reset passwords, deactivate.",
  },
  {
    href: "/admin/products",
    title: "Products / SKUs",
    body: "Add and edit products; link each SKU to a preferred vendor.",
  },
  {
    href: "/admin/vendors",
    title: "Vendors",
    body: "CRUD vendors including order days of week and blackout dates.",
  },
  {
    href: "/admin/locations",
    title: "Store locations",
    body: "Manage store / stock locations used by inventory and ordering.",
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Full access for administrators. Managers and staff cannot open these pages.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="min-h-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
