import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, ShoppingCart, Bell } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { Logo } from "@/components/layout/logo";
import { getCurrentUser } from "@/lib/auth";
import { unreadCount as unreadNotifications, countSubscribers } from "@/lib/data/account";
import { countPendingOrders } from "@/lib/data/orders";
import { countReviews } from "@/lib/data/reviews";
import { countLowStock } from "@/lib/data/products";

export const dynamic = "force-dynamic";

const NAV = [
  { section: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true }] },
  {
    section: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "Package", badge: "lowStock" },
      { href: "/admin/categories", label: "Categories", icon: "FolderTree" },
      { href: "/admin/brands", label: "Brands", icon: "Store" },
      { href: "/admin/inventory", label: "Inventory", icon: "Boxes", badge: "lowStock" },
      { href: "/admin/reviews", label: "Reviews", icon: "Star", badge: "pendingReviews" },
    ],
  },
  {
    section: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "ShoppingCart", badge: "pendingOrders" },
      { href: "/admin/customers", label: "Customers", icon: "Users" },
      { href: "/admin/coupons", label: "Coupons", icon: "Percent" },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
      { href: "/admin/subscribers", label: "Subscribers", icon: "Mail", badge: "subscribers" },
      { href: "/admin/settings", label: "Settings", icon: "Settings" },
    ],
  },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/account");

  const badges: Record<string, number> = {
    pendingOrders: countPendingOrders(),
    lowStock: countLowStock(),
    notifications: unreadNotifications(user.id),
    pendingReviews: countReviews("PENDING"),
    subscribers: countSubscribers(),
  };

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role, avatarColor: user.avatarColor }}
      badges={badges}
      nav={NAV as unknown as Array<{ section: string; items: Array<{ href: string; label: string; icon: string; badge?: string; exact?: boolean }> }>}
      brand={<Logo size="sm" />}
      footer={
        <div className="rounded-xl border border-ink-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-ink-700">
            <LifeBuoy className="size-3.5" /> Need a hand?
          </p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-500">
            Everything here is written straight to the local SQLite database — no external services required.
          </p>
        </div>
      }
      headerExtras={
        <>
          <Link
            href="/admin/orders?status=PENDING"
            className="relative grid size-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            aria-label={`${badges.pendingOrders} orders awaiting action`}
          >
            <ShoppingCart className="size-4" />
            {badges.pendingOrders > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-brand px-1 text-[0.62rem] font-bold leading-4 text-white">
                {badges.pendingOrders > 99 ? "99+" : badges.pendingOrders}
              </span>
            )}
          </Link>
          <Link
            href="/account/notifications"
            className="relative grid size-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {badges.notifications > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[0.62rem] font-bold leading-4 text-white">
                {badges.notifications > 99 ? "99+" : badges.notifications}
              </span>
            )}
          </Link>
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
