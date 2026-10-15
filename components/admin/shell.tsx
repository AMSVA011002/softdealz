"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  Mail,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  FolderTree,
  Store,
  Boxes,
  Star,
  ShoppingCart,
  Users,
  Percent,
  BarChart3,
  Mail,
  Settings,
  Bell,
};

export interface AdminNavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS | string;
  badge?: string;
  exact?: boolean;
}

export type AdminBadges = Record<string, number>;

export interface AdminNavSection {
  section: string;
  items: AdminNavItem[];
}

function Badge({ value }: { value: number }) {
  if (!value) return null;
  return (
    <span className="ml-auto rounded-full bg-ink-100 px-1.5 py-0.5 text-[0.66rem] font-bold text-ink-700 group-hover:bg-brand-100 group-hover:text-brand-800">
      {value > 99 ? "99+" : value}
    </span>
  );
}

export function AdminShell({
  user,
  nav,
  badges,
  brand,
  footer,
  headerExtras,
  children,
}: {
  user: { name: string; email: string; role: string; avatarColor: string };
  nav: AdminNavSection[];
  badges: AdminBadges;
  brand: React.ReactNode;
  footer?: React.ReactNode;
  headerExtras?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenu, setUserMenu] = React.useState(false);

  // Close the drawers whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const isActive = (item: AdminNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const navList = (
    <nav className="space-y-5">
      {nav.map((group) => (
        <div key={group.section}>
          <p className="px-2.5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ink-400">{group.section}</p>
          <ul className="mt-1.5 space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? Package;
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.84rem] font-medium transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-ink-600 hover:bg-white hover:text-brand-700",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-ink-400 group-hover:text-brand-600")} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && <Badge value={badges[item.badge] ?? 0} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex xl:w-72">
          <div className="flex h-16 shrink-0 items-center border-b border-ink-200 px-5">{brand}</div>
          <div className="flex-1 overflow-y-auto px-3.5 py-4">
            {navList}
            {footer && <div className="mt-5">{footer}</div>}
          </div>
          <div className="shrink-0 border-t border-ink-200 p-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full text-[0.75rem] font-bold text-white"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden
              >
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8rem] font-semibold text-ink-900">{user.name}</p>
                <p className="truncate text-[0.7rem] text-ink-500">{user.role}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="grid size-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-brand"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* topbar */}
          <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/92 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-ink-200 text-ink-600 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </button>

              <div className="lg:hidden">{brand}</div>

              <form action="/admin/products" method="get" className="ml-auto hidden md:block">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search products, orders, customers…"
                    aria-label="Search admin"
                    className="h-10 w-64 rounded-xl border border-ink-200 bg-ink-50 pl-9 pr-3 text-[0.83rem] transition-all focus:w-80 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/12 xl:w-80 xl:focus:w-96"
                  />
                </label>
              </form>

              <div className="ml-auto flex items-center gap-2 md:ml-0">{headerExtras}</div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenu((open) => !open)}
                  aria-expanded={userMenu}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl border border-ink-200 py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-brand-400"
                >
                  <span
                    className="grid size-7 place-items-center rounded-full text-[0.66rem] font-bold text-white"
                    style={{ backgroundColor: user.avatarColor }}
                    aria-hidden
                  >
                    {initials(user.name)}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-[0.8rem] font-semibold text-ink-800 sm:block">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="size-3.5 text-ink-400" />
                </button>

                {userMenu && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      aria-label="Close menu"
                      onClick={() => setUserMenu(false)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1.5 shadow-lift"
                    >
                      <div className="border-b border-ink-100 px-3.5 py-2.5">
                        <p className="truncate text-[0.83rem] font-semibold text-ink-900">{user.name}</p>
                        <p className="truncate text-[0.74rem] text-ink-500">{user.email}</p>
                      </div>
                      <Link href="/" className="block px-3.5 py-2 text-[0.83rem] text-ink-700 hover:bg-ink-50">
                        View storefront
                      </Link>
                      <Link href="/account" className="block px-3.5 py-2 text-[0.83rem] text-ink-700 hover:bg-ink-50">
                        My account
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="block px-3.5 py-2 text-[0.83rem] text-ink-700 hover:bg-ink-50"
                      >
                        Store settings
                      </Link>
                      <form action={logoutAction} className="border-t border-ink-100">
                        <button
                          type="submit"
                          className="w-full px-3.5 py-2 text-left text-[0.83rem] font-medium text-rose-brand hover:bg-rose-50"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-7">{children}</main>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(18rem,86vw)] flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-4">
              {brand}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-xl border border-ink-200 text-ink-600"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3.5 py-4">
              {navList}
              {footer && <div className="mt-5">{footer}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
