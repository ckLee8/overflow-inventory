"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
} | null;

const links = [
  { href: "/inventory", label: "Inventory" },
  { href: "/ordering", label: "Ordering" },
  { href: "/approvals", label: "Approvals" },
  { href: "/vendors", label: "Vendors" },
  { href: "/reports", label: "Reports" },
];

export function AppNav({ user }: { user?: NavUser }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");

  if (isLogin) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
          <span className="text-lg font-semibold text-brand-900">Overflow Inventory</span>
        </div>
      </header>
    );
  }

  const showAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-lg font-semibold text-brand-900">
            Overflow Inventory
          </Link>
          {user ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 lg:hidden">
              <span className="max-w-[10rem] truncate font-medium text-slate-800">
                {user.name ?? user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="min-h-9 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {showAdmin ? (
            <Link
              href="/admin"
              className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith("/admin")
                  ? "bg-brand-600 text-white"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              Admin
            </Link>
          ) : null}
        </nav>
        {user ? (
          <div className="hidden items-center gap-3 text-sm text-slate-600 lg:flex">
            <div className="text-right">
              <div className="font-medium text-slate-900">{user.name ?? user.email}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{user.role}</div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
