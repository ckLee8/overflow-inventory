import Link from "next/link";

const cards = [
  {
    href: "/inventory",
    title: "Inventory",
    body: "On-hand, reserved, on-order, and min levels by SKU × location.",
  },
  {
    href: "/ordering",
    title: "Ordering",
    body: "Weekly grid: SKU rows × day columns, grouped by vendor or store.",
  },
  {
    href: "/approvals",
    title: "Approvals",
    body: "Review a day’s quantities and place via vendor adapters.",
  },
  {
    href: "/vendors",
    title: "Vendors",
    body: "Schedules, blackout dates, and adapter stubs (Email PDF, Shopify, Amazon).",
  },
  {
    href: "/reports",
    title: "Reports",
    body: "Below-min SKUs, open POs, and stock movement history (Postgres-backed).",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-white shadow-lg">
        <h1 className="text-2xl font-semibold sm:text-3xl">Overflow Inventory</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          MVP scaffold for stock tracking, weekly multi-vendor ordering, and iPad-friendly PWA
          install. See DESIGN.md for the full product plan.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
