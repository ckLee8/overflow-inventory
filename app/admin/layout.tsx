import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/locations", label: "Locations" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-amber-200 bg-amber-50 p-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
