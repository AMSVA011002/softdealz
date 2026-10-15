import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth";
import { listUserOrders } from "@/lib/data/orders";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "ALL", label: "All orders" },
  { id: "ACTIVE", label: "In progress" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { tab = "ALL" } = await searchParams;
  const allOrders = listUserOrders(user.id);

  const filtered = allOrders.filter((order) => {
    if (tab === "ACTIVE") return ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status);
    if (tab === "DELIVERED") return order.status === "DELIVERED";
    if (tab === "CANCELLED") return ["CANCELLED", "REFUNDED"].includes(order.status);
    return true;
  });

  const counts: Record<string, number> = {
    ALL: allOrders.length,
    ACTIVE: allOrders.filter((order) => ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status))
      .length,
    DELIVERED: allOrders.filter((order) => order.status === "DELIVERED").length,
    CANCELLED: allOrders.filter((order) => ["CANCELLED", "REFUNDED"].includes(order.status)).length,
  };

  /**
   * Tabs are rendered as links (not buttons) so filtering works without JS
   * and each state gets a shareable URL.
   */
  const tabLinks = (
    <nav aria-label="Order filters" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {TABS.map((entry) => {
        const active = entry.id === tab;
        return (
          <Link
            key={entry.id}
            href={`/account/orders?tab=${entry.id}`}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
            }`}
          >
            {entry.label}
            <span className={`ml-1.5 text-[0.72rem] ${active ? "text-white/75" : "text-ink-400"}`}>
              {counts[entry.id]}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-fluid-2xl font-extrabold">My orders</h1>
          <p className="mt-0.5 text-[0.85rem] text-ink-500">
            {allOrders.length} order{allOrders.length === 1 ? "" : "s"} placed with SoftDealz
          </p>
        </div>
        <ButtonLink href="/track" variant="outline" size="sm">
          Track an order
        </ButtonLink>
      </div>

      {tabLinks}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title={tab === "ALL" ? "No orders yet" : "Nothing in this tab"}
          description={
            tab === "ALL"
              ? "Your order history will appear here once you check out."
              : "Try another filter to see your other orders."
          }
          action={<ButtonLink href="/products">Browse products</ButtonLink>}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((order) => (
            <li key={order.id} className="card-surface overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-50 px-4 py-3 sm:px-5">
                <div>
                  <p className="font-mono text-[0.85rem] font-bold text-ink-900">{order.orderNumber}</p>
                  <p className="text-[0.76rem] text-ink-500">
                    Placed {formatDateTime(order.placedAt)} · {order.paymentMethod}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill status={order.status} />
                  <span className="text-[0.9rem] font-extrabold text-ink-900">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <ul className="space-y-3">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <Link
                        href={`/product/${item.slug}`}
                        className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100"
                      >
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" unoptimized />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="line-clamp-1 text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[0.75rem] text-ink-500">
                          Qty {item.quantity} · {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {order.items.length > 3 && (
                  <p className="mt-2 text-[0.78rem] text-ink-500">
                    + {order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <ButtonLink href={`/account/orders/${order.id}`} size="sm">
                    View details
                  </ButtonLink>
                  {["SHIPPED", "CONFIRMED", "PROCESSING"].includes(order.status) && (
                    <ButtonLink href="/track" size="sm" variant="outline">
                      Track parcel
                    </ButtonLink>
                  )}
                  {order.status === "DELIVERED" && (
                    <ButtonLink
                      href={`/product/${order.items[0]?.slug ?? ""}`}
                      size="sm"
                      variant="outline"
                    >
                      Write a review
                    </ButtonLink>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
