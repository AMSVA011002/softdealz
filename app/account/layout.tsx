import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Heart,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  Settings,
  User,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/ui/nav";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, unreadCount, listWishlist } from "@/lib/data/account";
import { listUserOrders } from "@/lib/data/orders";
import { formatPrice, initials } from "@/lib/format";
import { logoutAction } from "@/app/actions/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const orders = listUserOrders(user.id);
  const wishlist = listWishlist(user.id);
  const unread = unreadCount(user.id);
  const notifications = listNotifications(user.id, 1);
  const totalSpent = orders
    .filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED")
    .reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) =>
    ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status),
  ).length;

  return (
    <div className="surface-brand min-h-screen">
      <div className="container-page py-6 lg:py-9">
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[18rem_minmax(0,1fr)]">
          {/* sidebar */}
          <aside className="mb-5 lg:mb-0">
            <div className="card-surface p-4 lg:sticky lg:top-40">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full text-[0.9rem] font-bold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                  aria-hidden
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.88rem] font-semibold text-ink-900">{user.name}</p>
                  <p className="truncate text-[0.75rem] text-ink-500">{user.email}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-ink-50 p-3 text-center">
                <div>
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">Orders</dt>
                  <dd className="text-[0.95rem] font-extrabold text-ink-900">{orders.length}</dd>
                </div>
                <div>
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">Active</dt>
                  <dd className="text-[0.95rem] font-extrabold text-brand-700">{activeOrders}</dd>
                </div>
                <div>
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">Spent</dt>
                  <dd className="text-[0.8rem] font-extrabold text-ink-900">{formatPrice(totalSpent)}</dd>
                </div>
              </dl>

              <nav className="mt-4 space-y-0.5">
                <NavLink href="/account" icon={<LayoutDashboard className="size-4" />} exact>
                  Dashboard
                </NavLink>
                <NavLink href="/account/orders" icon={<Package className="size-4" />} badge={activeOrders}>
                  My orders
                </NavLink>
                <NavLink href="/account/wishlist" icon={<Heart className="size-4" />} badge={wishlist.length}>
                  Wishlist
                </NavLink>
                <NavLink href="/account/addresses" icon={<MapPin className="size-4" />}>
                  Addresses
                </NavLink>
                <NavLink href="/account/reviews" icon={<MessageSquare className="size-4" />}>
                  My reviews
                </NavLink>
                <NavLink href="/account/notifications" icon={<Bell className="size-4" />} badge={unread}>
                  Notifications
                </NavLink>
                <NavLink href="/account/settings" icon={<Settings className="size-4" />}>
                  Settings
                </NavLink>
              </nav>

              <div className="mt-4 space-y-2 border-t border-ink-200 pt-4">
                {user.role === "ADMIN" && (
                  <ButtonLink href="/admin" variant="dark" size="sm" fullWidth>
                    <LayoutDashboard className="size-3.5" /> Admin dashboard
                  </ButtonLink>
                )}
                <ButtonLink href="/products" variant="outline" size="sm" fullWidth>
                  <User className="size-3.5" /> Continue shopping
                </ButtonLink>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-xl px-3 py-2 text-[0.82rem] font-semibold text-rose-brand transition-colors hover:bg-rose-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>

            {/* mobile quick links */}
            <div className="mt-3 lg:hidden">
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {[
                  { href: "/account/orders", label: "Orders" },
                  { href: "/account/wishlist", label: "Wishlist" },
                  { href: "/account/addresses", label: "Addresses" },
                  { href: "/account/settings", label: "Settings" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>

      {notifications.length > 0 && !notifications[0].read && (
        <div className="container-page pb-6">
          <p className="text-[0.75rem] text-ink-400">
            You have an unread notification ·{" "}
            <Link href="/account/notifications" className="font-semibold text-brand-700">
              view
            </Link>
          </p>
        </div>
      )}

      <div className="container-page hidden pb-8 lg:block">
        <Logo size="sm" className="opacity-40" />
      </div>
    </div>
  );
}
