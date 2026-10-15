"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, PackageSearch, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

interface TrackResult {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  placedAt: string;
  total: number;
  currency: string;
  customerName: string;
  trackingNumber: string | null;
  carrier: string | null;
  itemCount: number;
  items: Array<{ title: string; slug: string; image: string; quantity: number; total: number }>;
  timeline: Array<{ id: string; status: string; message: string; createdAt: string }>;
  shippingAddress: Record<string, string>;
}

const STEP_LABELS: Record<string, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Packing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function TrackForm() {
  const [orderNumber, setOrderNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TrackResult | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/track?order=${encodeURIComponent(orderNumber.trim())}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as { ok: boolean; order?: TrackResult; error?: string };

      if (!data.ok || !data.order) {
        setError(
          response.status === 401
            ? "Sign in to the account used to place this order."
            : data.error ?? "We could not find that order",
        );
        return;
      }
      setResult(data.order);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="card-surface space-y-4 p-5">
        <Field label="Order number" htmlFor="order" required hint="Looks like SD-20261013-1234">
          <Input
            id="order"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="SD-20261013-1234"
            required
          />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={loading}>
          <Search className="size-4" /> Track my order
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4"
        >
          <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-rose-brand" />
          <div className="text-[0.84rem] text-rose-800">
            <p className="font-semibold">{error}</p>
            <p className="mt-0.5 text-rose-700">
              Double-check the order number, or{" "}
              <Link href="/contact" className="font-semibold underline">
                contact support
              </Link>{" "}
              and we&apos;ll find it for you.
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-5 card-surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-50 px-5 py-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-wide text-ink-400">Order</p>
              <p className="font-mono text-[0.95rem] font-bold text-ink-900">{result.orderNumber}</p>
              <p className="mt-0.5 text-[0.78rem] text-ink-500">Placed {formatDateTime(result.placedAt)}</p>
            </div>
            <div className="text-right">
              <StatusPill status={result.status} />
              <p className="mt-1.5 text-[0.78rem] text-ink-500">
                {result.itemCount} item{result.itemCount === 1 ? "" : "s"} · {formatPrice(result.total, result.currency)}
              </p>
            </div>
          </div>

          {/* progress */}
          <div className="px-5 py-5">
            <h2 className="text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">Progress</h2>
            <ol className="mt-4 space-y-0">
              {result.timeline.map((event, index) => (
                <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {index < result.timeline.length - 1 && (
                    <span aria-hidden className="absolute left-[0.68rem] top-6 h-full w-0.5 bg-ink-200" />
                  )}
                  <span
                    className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-white ${
                      index === result.timeline.length - 1 ? "bg-brand-600" : "bg-ink-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-[0.85rem] font-semibold text-ink-900">
                      {STEP_LABELS[event.status] ?? event.status}
                    </p>
                    <p className="text-[0.8rem] text-ink-500">{event.message}</p>
                    <p className="mt-0.5 text-[0.74rem] text-ink-400">{formatDateTime(event.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>

            {result.trackingNumber && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ocean-200 bg-ocean-50 p-3.5">
                <Truck className="size-5 shrink-0 text-ocean-600" />
                <div>
                  <p className="text-[0.85rem] font-semibold text-ocean-900">
                    {result.carrier ?? "Courier"} · {result.trackingNumber}
                  </p>
                  <p className="text-[0.78rem] text-ocean-700">
                    Quote this number when calling the courier about your parcel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* items */}
          <div className="border-t border-ink-200 px-5 py-4">
            <h2 className="mb-3 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
              In this parcel
            </h2>
            <ul className="space-y-3">
              {result.items.map((item) => (
                <li key={item.slug} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <Image src={item.image} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.slug}`}
                      className="line-clamp-1 text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
                    >
                      {item.title}
                    </Link>
                    <span className="text-[0.75rem] text-ink-500">Qty {item.quantity}</span>
                  </span>
                  <span className="shrink-0 text-[0.84rem] font-semibold text-ink-900">
                    {formatPrice(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* address */}
          <div className="border-t border-ink-200 px-5 py-4">
            <h2 className="mb-2 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
              Delivery address
            </h2>
            <p className="text-[0.82rem] leading-relaxed text-ink-600">
              {result.shippingAddress.fullName}
              <br />
              {result.shippingAddress.line1}
              <br />
              {result.shippingAddress.city}, {result.shippingAddress.state} {result.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      )}

      {!result && !error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4">
          <PackageSearch className="mt-0.5 size-5 shrink-0 text-ink-400" />
          <p className="text-[0.82rem] text-ink-500">
            Your order number is in the confirmation email and under{" "}
            <Link href="/account/orders" className="font-semibold text-brand-700 hover:underline">
              My orders
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
