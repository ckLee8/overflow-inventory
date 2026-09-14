"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/clock", label: "Test clock" },
];

export function AdminSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1.5 shadow-card">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-smooth",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
