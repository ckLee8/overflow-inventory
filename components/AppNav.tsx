"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/components/ui";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
} | null;

const links = [
  { href: "/", label: "Board", icon: BoardIcon, exact: true },
  { href: "/inventory", label: "Stock", icon: BoxesIcon },
  { href: "/ordering", label: "Order", icon: CartIcon },
  { href: "/approvals", label: "Approve", icon: CheckIcon },
  { href: "/reports", label: "Reports", icon: ChartIcon },
] as const;

const more = [
  { href: "/vendors", label: "Vendors", icon: StoreIcon },
] as const;

export function AppNav({ user, children }: { user?: NavUser; children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");

  if (isLogin) {
    return <>{children}</>;
  }

  const showAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <BoxesIcon className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-medium tracking-tight">Overflow</span>
              <span className="hidden text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Stock desk
              </span>
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} exact={"exact" in link} />
            ))}
            {more.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} />
            ))}
            {showAdmin ? (
              <Link
                href="/admin"
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-smooth",
                  pathname.startsWith("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <GearIcon className="h-4 w-4" />
                Admin
              </Link>
            ) : null}
          </nav>

          {user ? (
            <div className="ml-auto flex items-center gap-2 text-sm">
              {showAdmin ? (
                <Link
                  href="/admin"
                  className={cn(
                    "inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-smooth md:hidden",
                    pathname.startsWith("/admin")
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted",
                  )}
                >
                  Admin
                </Link>
              ) : null}
              <div className="hidden text-right lg:block">
                <div className="max-w-[12rem] truncate font-medium text-foreground">{user.name ?? user.email}</div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{user.role}</div>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 min-h-11 items-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors duration-150 ease-smooth hover:bg-muted"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 gap-1 px-1 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-smooth",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function BoxesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.24 2.24 0 0 1-1.59-.68.47.47 0 0 0-.82 0A2.24 2.24 0 0 1 16 12a2.24 2.24 0 0 1-1.59-.68.47.47 0 0 0-.82 0A2.24 2.24 0 0 1 12 12a2.24 2.24 0 0 1-1.59-.68.47.47 0 0 0-.82 0A2.24 2.24 0 0 1 8 12a2.24 2.24 0 0 1-1.59-.68.47.47 0 0 0-.82 0A2.24 2.24 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
