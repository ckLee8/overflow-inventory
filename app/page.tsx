import Link from "next/link";
import { Card, PageHead } from "@/components/ui";

const cards = [
  {
    href: "/inventory",
    kicker: "Stock",
    title: "Inventory",
    body: "On-hand, expected, and min levels by SKU × location. Receive is a checkbox — it does not change stock.",
  },
  {
    href: "/ordering",
    kicker: "Week",
    title: "Ordering",
    body: "Weekly grid: SKU rows × day columns, grouped by vendor or store. Only today is editable.",
  },
  {
    href: "/approvals",
    kicker: "Place",
    title: "Approvals",
    body: "Review draft and approved purchase orders. Day-plan split-and-place is next.",
  },
  {
    href: "/vendors",
    kicker: "Schedule",
    title: "Vendors",
    body: "Order days and adapter stubs — Email PDF, Shopify wholesale, Amazon.",
  },
  {
    href: "/reports",
    kicker: "Watch",
    title: "Reports",
    body: "SKU × location counts, total on hand, and SKUs sitting below min.",
  },
];

export default function HomePage() {
  return (
    <div>
      <PageHead kicker="Overflow · weekly desk" title="What needs a hand today">
        Stock tracker, weekly multi-vendor ordering, and an iPad-friendly PWA. One desk for
        on-hand, today's grid, and inbound receipts.
      </PageHead>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group min-h-28 rounded-xl border border-border bg-card p-5 shadow-card transition-[box-shadow,transform] duration-150 ease-smooth hover:shadow-card-hover active:scale-[0.99]"
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
        <Card className="flex min-h-28 flex-col justify-center p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Roles
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ADMIN runs the catalog. MANAGER counts and receives. STAFF fills today's grid.
          </p>
        </Card>
      </section>
    </div>
  );
}
