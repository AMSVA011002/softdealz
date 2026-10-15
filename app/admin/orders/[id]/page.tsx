import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MapPin, Phone, Truck } from "lucide-react";
import { AdminPageHeader, AdminPanel } from "@/components/admin/kit";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { getOrderById, statusFlow } from "@/lib/data/orders";
import { updateOrderStatusAction, updatePaymentStatusAction, notifyUserAction } from "@/app/actions/admin";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string>;

  return (
    <>
      <AdminPageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.placedAt)} · ${order.items.length} item${
          order.items.length === 1 ? "" : "s"
        } · ${formatPrice(order.total)}`}
        breadcrumb={[{ label: "Orders", href: "/admin/orders" }, { label: order.orderNumber }]}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill status={order.status} />
            <ButtonLink href={`/checkout/success/${order.orderNumber}`} variant="outline" size="sm">
              <ExternalLink className="size-3.5" /> Customer view
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <AdminPanel title="Fulfilment" description="Update the status to keep the customer informed">
            <OrderTimeline order={order} flow={statusFlow()} />
          </AdminPanel>

          <AdminPanel title="Items" padded={false}>
            <ul className="divide-y divide-ink-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" unoptimized />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(item.sku)}`}
                      className="line-clamp-1 text-[0.85rem] font-medium text-ink-900 hover:text-brand-700"
                    >
                      {item.title}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.72rem] text-ink-500">{item.sku}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[0.78rem] text-ink-500">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </span>
                    <span className="block text-[0.86rem] font-semibold text-ink-900">{formatPrice(item.total)}</span>
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-ink-200 bg-ink-50 px-4 py-4 text-[0.85rem] sm:px-5">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Shipping</dt>
                <dd className="font-semibold">{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-brand-700">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd className="font-semibold">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-200 pt-2">
                <dt className="font-bold">Total</dt>
                <dd className="text-fluid-lg font-extrabold text-brand-700">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </AdminPanel>

          <div className="grid gap-5 md:grid-cols-2">
            <AdminPanel title="Delivery address">
              <p className="text-[0.84rem] leading-relaxed text-ink-600">
                <span className="block font-semibold text-ink-900">{address.fullName}</span>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country}
              </p>
              <div className="mt-3 space-y-1.5 text-[0.8rem] text-ink-600">
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-ink-400" /> {address.phone ?? "—"}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-ink-400" /> {order.email}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-ink-400" /> {address.city}
                </p>
              </div>
              {order.note && (
                <p className="mt-3 rounded-xl bg-ink-50 p-3 text-[0.8rem] text-ink-600">
                  <span className="font-semibold text-ink-800">Customer note:</span> {order.note}
                </p>
              )}
            </AdminPanel>

            <AdminPanel title="Payment">
              <div className="flex items-center gap-2.5">
                <StatusPill status={order.paymentStatus} />
                <span className="text-[0.84rem] font-semibold text-ink-900">
                  {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}
                </span>
              </div>
              <p className="mt-2 text-[0.8rem] text-ink-500">
                {order.paymentMethod === "COD"
                  ? "Collect the full amount when the courier hands over the parcel."
                  : "Simulated card payment captured at checkout."}
              </p>

              <form action={updatePaymentStatusAction} className="mt-4 space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <Field label="Payment status" htmlFor="paymentStatus">
                  <Select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="FAILED">Failed</option>
                  </Select>
                </Field>
                <Button type="submit" variant="outline" size="sm" fullWidth>
                  Update payment
                </Button>
              </form>
            </AdminPanel>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          <AdminPanel title="Change status">
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-500">Current</p>
                <div className="mt-1.5">
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </div>
              </div>

              <form action={updateOrderStatusAction} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="hidden">
                  <OrderStatusForm orderId={order.id} status={order.status} compact />
                </div>
                <Field label="New status" htmlFor="status">
                  <Select id="status" name="status" defaultValue={order.status}>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Carrier" htmlFor="carrier">
                    <Input id="carrier" name="carrier" defaultValue={order.carrier ?? "SoftDealz Express"} />
                  </Field>
                  <Field label="Tracking #" htmlFor="trackingNumber">
                    <Input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? undefined} />
                  </Field>
                </div>
                <Field label="Message for the customer" htmlFor="message" hint="Shown on their tracking timeline">
                  <Textarea id="message" name="message" rows={2} placeholder="Handed to courier, arriving tomorrow." />
                </Field>
                <Button type="submit" fullWidth size="sm">
                  <Truck className="size-3.5" /> Save &amp; notify
                </Button>
              </form>
            </div>
          </AdminPanel>

          <AdminPanel title="Message the customer">
            <form action={notifyUserAction} className="space-y-3">
              <input type="hidden" name="userId" value={order.userId ?? ""} />
              <Field label="Title" htmlFor="title">
                <Input id="title" name="title" defaultValue={`About your order ${order.orderNumber}`} />
              </Field>
              <Field label="Message" htmlFor="body" required>
                <Textarea id="body" name="body" rows={4} required placeholder="We're packing your order today." />
              </Field>
              <Button type="submit" variant="outline" size="sm" fullWidth>
                Send notification
              </Button>
            </form>
          </AdminPanel>

          <AdminPanel title="Customer">
            <p className="text-[0.85rem] font-semibold text-ink-900">{order.customerName}</p>
            <p className="mt-0.5 text-[0.78rem] text-ink-500">{order.email}</p>
            <p className="mt-0.5 text-[0.78rem] text-ink-500">{order.phone ?? address.phone}</p>
            <ButtonLink href={`/admin/customers/${order.userId}`} variant="outline" size="sm" fullWidth className="mt-3">
              View customer profile
            </ButtonLink>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
