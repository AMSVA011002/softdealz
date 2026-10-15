import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Heart,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth";
import { listUserOrders } from "@/lib/data/orders";
import { listWishlist, listNotifications, listAddresses } from "@/lib/data/account";
import { formatPrice, timeAgo } from "@/lib/format";
import { activePromotions } from "@/lib/data/coupons";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = listUserOrders(user.id);
  const wishlist = listWishlist(user.id);
  const addresses = listAddresses(user.id);
  const notifications = listNotifications(user.id, 4);
  const coupons = activePromotions(2);
  const recentOrders = orders.slice(0, 3);
  const activeOrder = orders.find((order) =>
    ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status),
  );

  return (
    <div className="space-y-6">
      {/* greeting */}
      <div className="card-surface overflow-hidden">
        <div className="surface-brand p-5 sm:p-6">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.16em] text-brand-700">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1.5 text-fluid-2xl font-extrabold">
            Hello {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 max-w-lg text-[0.88rem] text-ink-600">
            {orders.length > 0
              ? `You've placed ${orders.length} order${orders.length === 1 ? "" : "s"} with us so far. Here's what's happening.`
              : "Welcome aboard. Start browsing and your orders, wishlist and tracking will all live here."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <ButtonLink href="/products" size="sm">
              Shop new arrivals
            </ButtonLink>
            <ButtonLink href="/account/orders" variant="outline" size="sm">
              View all orders
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* active order tracker */}
      {activeOrder && (
        <div className="card-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                <Truck className="size-5" />
              </span>
              <div>
                <p className="text-[0.85rem] font-bold text-ink-900">
                  Order {activeOrder.orderNumber} is on the way
                </p>
                <p className="mt-0.5 text-[0.82rem] text-ink-500">
                  {activeOrder.items.length} item{activeOrder.items.length === 1 ? "" : "s"} ·{" "}
                  {formatPrice(activeOrder.total)} · placed {timeAgo(activeOrder.placedAt)}
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <StatusPill status={activeOrder.status} />
                  {activeOrder.trackingNumber && (
                    <span className="font-mono text-[0.75rem] text-ink-500">
                      {activeOrder.trackingNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ButtonLink href={`/account/orders/${activeOrder.id}`} size="sm" variant="ocean">
              Track order
            </ButtonLink>
          </div>
        </div>
      )}

      {/* stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/account/orders", icon: Package, label: "Orders", value: orders.length, tone: "brand" },
          { href: "/account/wishlist", icon: Heart, label: "Wishlist", value: wishlist.length, tone: "ocean" },
          { href: "/account/addresses", icon: MapPin, label: "Addresses", value: addresses.length, tone: "brand" },
          {
            href: "/account/notifications",
            icon: Bell,
            label: "Notifications",
            value: notifications.filter((entry) => !entry.read).length,
            tone: "ocean",
          },
        ].map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="card-surface group flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                tile.tone === "brand" ? "bg-brand-50 text-brand-600" : "bg-ocean-50 text-ocean-600"
              }`}
            >
              <tile.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-fluid-xl font-extrabold text-ink-900">{tile.value}</span>
              <span className="block text-[0.78rem] text-ink-500">{tile.label}</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* recent orders */}
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
            <h2 className="text-fluid-lg font-bold">Recent orders</h2>
            <Link href="/account/orders" className="text-[0.8rem] font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Package className="size-6" />}
                title="No orders yet"
                description="When you place your first order it will appear here with live tracking."
                action={<ButtonLink href="/products" size="sm">Start shopping</ButtonLink>}
                compact
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {recentOrders.map((order) => (
                <li key={order.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="font-mono text-[0.85rem] font-bold text-ink-900 hover:text-brand-700"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-[0.78rem] text-ink-500">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                        {formatPrice(order.total)} · {timeAgo(order.placedAt)}
                      </p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    {order.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        className="relative size-12 overflow-hidden rounded-lg bg-ink-100"
                        title={item.title}
                      >
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" unoptimized />
                      </Link>
                    ))}
                    {order.items.length > 4 && (
                      <span className="grid size-12 place-items-center rounded-lg bg-ink-100 text-[0.72rem] font-semibold text-ink-600">
                        +{order.items.length - 4}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* side column */}
        <div className="space-y-5">
          {coupons.length > 0 && (
            <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4">
              <p className="flex items-center gap-2 text-[0.8rem] font-bold uppercase tracking-wide text-brand-700">
                <Sparkles className="size-4" /> Coupons for you
              </p>
              <ul className="mt-3 space-y-2.5">
                {coupons.map((coupon) => (
                  <li key={coupon.id} className="rounded-xl border border-brand-200 bg-white p-3">
                    <p className="font-mono text-[0.88rem] font-extrabold text-brand-700">{coupon.code}</p>
                    <p className="mt-0.5 text-[0.78rem] text-ink-500">{coupon.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-surface p-4">
            <h2 className="text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">Notifications</h2>
            {notifications.length === 0 ? (
              <p className="mt-2 text-[0.82rem] text-ink-500">Nothing new right now.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {notifications.map((notification) => (
                  <li key={notification.id} className="border-b border-ink-100 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-[0.82rem] font-semibold text-ink-900">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2-safe text-[0.78rem] text-ink-500">{notification.body}</p>
                    <p className="mt-1 text-[0.72rem] text-ink-400">{timeAgo(notification.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/account/notifications"
              className="mt-3 block text-[0.78rem] font-semibold text-brand-700 hover:underline"
            >
              See all notifications
            </Link>
          </div>

          {wishlist.length > 0 && (
            <div className="card-surface p-4">
              <h2 className="text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">From your wishlist</h2>
              <ul className="mt-3 space-y-3">
                {wishlist.slice(0, 3).map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/product/${entry.product.slug}`} className="group flex gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        <Image
                          src={entry.product.images[0] ?? "/images/products/placeholder.svg"}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2-safe text-[0.78rem] font-medium text-ink-800 group-hover:text-brand-700">
                          {entry.product.title}
                        </span>
                        <span className="text-[0.78rem] font-bold text-brand-700">
                          {formatPrice(entry.product.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/account/wishlist"
                className="mt-3 block text-[0.78rem] font-semibold text-brand-700 hover:underline"
              >
                View wishlist
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
