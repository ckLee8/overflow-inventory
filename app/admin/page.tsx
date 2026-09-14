import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui";
import { auth } from "@/lib/auth";

const cards = [
  {
    href: "/admin/users",
    kicker: "Access",
    title: "Users",
    body: "Create accounts, set roles (ADMIN / MANAGER / STAFF), reset passwords, deactivate.",
  },
  {
    href: "/admin/products",
    kicker: "Catalog",
    title: "Products / SKUs",
    body: "Add and edit products; link each SKU to a preferred vendor.",
  },
  {
    href: "/admin/vendors",
    kicker: "Adapters",
    title: "Vendors",
    body: "CRUD vendors including order days of week and blackout dates.",
  },
  {
    href: "/admin/locations",
    kicker: "Floor",
    title: "Store locations",
    body: "Manage store / stock locations used by inventory and ordering.",
  },
  {
    href: "/admin/clock",
    kicker: "Test",
    title: "Test clock",
    body: "Pretend it is another day to unlock that weekly-grid column and walk week boundaries.",
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div>
      <PageHead kicker="Admin · catalog" title="Admin">
        Full access for administrators. Managers and staff cannot open these pages.
      </PageHead>
      <section className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="min-h-28 rounded-xl border border-border bg-card p-5 shadow-card transition-[box-shadow,transform] duration-150 ease-smooth hover:shadow-card-hover active:scale-[0.99]"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {card.kicker}
            </p>
            <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-foreground">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
