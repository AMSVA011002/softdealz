import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Package, Truck } from "lucide-react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByNumber, statusFlow } from "@/lib/data/orders";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  const user = await getCurrentUser();
  // Order details are private: only the owner (or an admin) can view them.
  const isOwner = user && order.userId === user.id;
  const isAdmin = user?.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const address = order.shippingAddress as Record<string, string>;
  const eta = new Date(order.placedAt.replace(" ", "T"));
  eta.setDate(eta.getDate() + 4);

  return (
    <div className="surface-brand min-h-screen py-8 lg:py-12">
      <div className="container-page max-w-4xl">
        {/* confirmation header */}
        <div className="card-surface overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-ocean-600 px-5 py-8 text-center sm:px-8">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/20 backdrop-blur">
              <CheckCircle2 className="size-9 text-white" />
            </span>
            <h1 className="mt-4 text-fluid-3xl font-extrabold text-white">Thank you, your order is confirmed</h1>
            <p className="mt-2 text-fluid-base text-white/85">
              Order <span className="font-mono font-bold text-white">{order.orderNumber}</span> · placed{" "}
              {formatDateTime(order.placedAt)}
            </p>
            <p className="mt-1 text-[0.85rem] text-white/75">
              A confirmation has been sent to {order.email}
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ink-400">Total paid</p>
              <p className="mt-1 text-fluid-xl font-extrabold text-ink-900">{formatPrice(order.total)}</p>
              <p className="text-[0.78rem] text-ink-500">
                {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod.toLowerCase()} ·{" "}
                {order.paymentStatus.toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ink-400">Estimated delivery</p>
              <p className="mt-1 text-fluid-xl font-extrabold text-ink-900">
                {eta.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
              <p className="text-[0.78rem] text-ink-500">2–4 working days</p>
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ink-400">Items</p>
              <p className="mt-1 text-fluid-xl font-extrabold text-ink-900">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
              <p className="text-[0.78rem] text-ink-500">{order.items.length} product lines</p>
            </div>
          </div>
        </div>

        {/* tracking + actions */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="card-surface p-5">
            <h2 className="text-fluid-lg font-bold">Order progress</h2>
            <p className="mt-0.5 text-[0.82rem] text-ink-500">
              Track live status any time from your account or the public tracking page.
            </p>
            <OrderTimeline order={order} flow={statusFlow()} className="mt-5" />
          </div>

          <div className="space-y-4">
            <div className="card-surface p-4">
              <h3 className="flex items-center gap-2 text-[0.85rem] font-bold text-ink-900">
                <MapPin className="size-4 text-brand-600" /> Delivery address
              </h3>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-600">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 ? <>, {address.line2}</> : null}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.phone}
              </p>
            </div>

            <div className="card-surface space-y-2.5 p-4">
              <ButtonLink href={`/account/orders/${order.id}`} fullWidth>
                <Package className="size-4" /> View order details
              </ButtonLink>
              <ButtonLink href="/track" variant="outline" fullWidth>
                <Truck className="size-4" /> Track this order
              </ButtonLink>
              <ButtonLink href="/products" variant="ghost" fullWidth>
                Continue shopping
              </ButtonLink>
            </div>

            <Alert tone="info" title="Need to change something?">
              Call us on +94 11 234 5678 within 2 hours and we can usually adjust the order before it is packed.
            </Alert>
          </div>
        </div>

        {/* items + summary */}
        <div className="mt-6 card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
            <h2 className="text-fluid-lg font-bold">Order summary</h2>
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-ink-500">
              <Clock className="size-3.5" /> {formatDateTime(order.placedAt)}
            </span>
          </div>

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
                  <Link href={`/product/${item.slug}`} className="text-[0.88rem] font-semibold text-ink-900 hover:text-brand-700">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-[0.78rem] text-ink-500">
                    SKU {item.sku} · Qty {item.quantity} · {formatPrice(item.unitPrice)} each
                  </p>
                </div>
                <p className="shrink-0 text-[0.88rem] font-bold text-ink-900">{formatPrice(item.total)}</p>
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

          <div className="print-hidden flex flex-wrap items-center gap-3 border-t border-ink-200 px-5 py-4">
            <p className="text-[0.78rem] text-ink-500">
              Keep this page for your records — you can also print or save it as a PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
