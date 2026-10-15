import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MapPin, Phone, Truck } from "lucide-react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth";
import { getOrderById, statusFlow } from "@/lib/data/orders";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const order = getOrderById(id);
  // A shopper can only ever see their own orders.
  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) notFound();

  const address = order.shippingAddress as Record<string, string>;
  const eta = new Date(order.placedAt.replace(" ", "T"));
  eta.setDate(eta.getDate() + 4);
  const delivered = order.status === "DELIVERED";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-ink-500 transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="size-3.5" /> Back to orders
          </Link>
          <h1 className="mt-2 text-fluid-2xl font-extrabold">
            Order <span className="font-mono">{order.orderNumber}</span>
          </h1>
          <p className="mt-0.5 text-[0.84rem] text-ink-500">
            Placed {formatDateTime(order.placedAt)} · {order.items.length} item
            {order.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill status={order.status} className="px-3 py-1.5 text-[0.8rem]" />
          <StatusPill status={order.paymentStatus} />
        </div>
      </div>

      {/* progress */}
      <div className="card-surface p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-fluid-lg font-bold">Delivery progress</h2>
            <p className="mt-0.5 text-[0.82rem] text-ink-500">
              {delivered
                ? "Delivered — we hope you love it."
                : `Estimated arrival ${eta.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}`}
            </p>
          </div>
          {order.trackingNumber && (
            <div className="rounded-xl border border-ocean-200 bg-ocean-50 px-3.5 py-2.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ocean-600">
                {order.carrier ?? "Courier"}
              </p>
              <p className="font-mono text-[0.85rem] font-bold text-ocean-900">{order.trackingNumber}</p>
            </div>
          )}
        </div>
        <OrderTimeline order={order} flow={statusFlow()} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* items */}
        <div className="card-surface overflow-hidden">
          <h2 className="border-b border-ink-200 px-5 py-4 text-fluid-lg font-bold">Items</h2>
          <ul className="divide-y divide-ink-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4 sm:p-5">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-100"
                >
                  <Image src={item.image} alt="" fill sizes="80px" className="object-cover" unoptimized />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="text-[0.88rem] font-semibold text-ink-900 hover:text-brand-700"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-[0.78rem] text-ink-500">
                    SKU {item.sku} · Qty {item.quantity} · {formatPrice(item.unitPrice)} each
                  </p>
                  <div className="mt-2 flex gap-2">
                    <ButtonLink href={`/product/${item.slug}`} size="sm" variant="outline">
                      Buy again
                    </ButtonLink>
                    {delivered && (
                      <ButtonLink href={`/product/${item.slug}#reviews`} size="sm" variant="ghost">
                        Review
                      </ButtonLink>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-[0.9rem] font-bold text-ink-900">{formatPrice(item.total)}</p>
              </li>
            ))}
          </ul>

          <dl className="space-y-2.5 border-t border-ink-200 bg-ink-50 px-5 py-4 text-[0.86rem]">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="font-semibold">
                {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand-700">
                <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                <dd className="font-semibold">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-200 pt-2.5">
              <dt className="font-bold text-ink-900">Total</dt>
              <dd className="text-fluid-xl font-extrabold text-brand-700">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* side info */}
        <div className="space-y-5">
          <div className="card-surface p-4">
            <h2 className="flex items-center gap-2 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
              <MapPin className="size-4 text-brand-600" /> Delivery address
            </h2>
            <p className="mt-2.5 text-[0.83rem] leading-relaxed text-ink-600">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 ? <>, {address.line2}</> : null}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
            {address.phone && (
              <p className="mt-2 flex items-center gap-1.5 text-[0.8rem] text-ink-500">
                <Phone className="size-3.5" /> {address.phone}
              </p>
            )}
          </div>

          <div className="card-surface p-4">
            <h2 className="text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">Payment</h2>
            <dl className="mt-2.5 space-y-2 text-[0.83rem]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Method</dt>
                <dd className="font-semibold text-ink-900">
                  {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Status</dt>
                <dd>
                  <StatusPill status={order.paymentStatus} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Amount</dt>
                <dd className="font-semibold text-ink-900">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          {order.note && (
            <Alert tone="info" title="Your delivery note">
              {order.note}
            </Alert>
          )}

          <div className="card-surface space-y-2.5 p-4">
            <ButtonLink href={`/track`} variant="outline" fullWidth size="sm">
              <Truck className="size-3.5" /> Public tracking page
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" fullWidth size="sm">
              Need help with this order?
            </ButtonLink>
            <p className="flex items-center gap-1.5 text-[0.74rem] text-ink-400">
              <Download className="size-3.5" /> Tip: print this page to keep a receipt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
