import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, Mail, MapPin, Phone, Send } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, StatCard, type Column } from "@/components/admin/kit";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RoleSelect, UserStatusForm } from "@/components/admin/customer-controls";
import { get, all } from "@/lib/db";
import { notifyUserAction } from "@/app/actions/admin";
import { listUserOrders } from "@/lib/data/orders";
import { listAddresses } from "@/lib/data/account";
import { formatCompactPrice, formatDate, formatDateTime, formatPrice, initials } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Customer detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = get("SELECT * FROM users WHERE id = ?", [id]);
  if (!row) notFound();

  const user = {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    role: String(row.role),
    status: String(row.status),
    avatarColor: String(row.avatar_color ?? "#0a57a0"),
    createdAt: String(row.created_at),
    emailVerified: Boolean(row.email_verified),
  };

  const orders = listUserOrders(user.id);
  const addresses = listAddresses(user.id);
  const notifications = all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 8",
    [user.id],
  ).map((notification) => ({
    id: String(notification.id),
    title: String(notification.title),
    body: String(notification.body),
    createdAt: String(notification.created_at),
    read: Boolean(notification.read),
  }));

  const spend = orders
    .filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);
  const cancelled = orders.filter((order) => ["CANCELLED", "REFUNDED"].includes(order.status)).length;

  const orderColumns: Array<Column<Order>> = [
    {
      key: "order",
      header: "Order",
      cell: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-mono text-[0.82rem] font-bold text-ink-900 hover:text-brand-700"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (order) => (
        <span className="flex items-center gap-1.5">
          {order.items.slice(0, 3).map((item) => (
            <span key={item.id} className="relative size-8 overflow-hidden rounded-lg bg-ink-100">
              <Image src={item.image} alt="" fill sizes="32px" className="object-cover" unoptimized />
            </span>
          ))}
          {order.items.length > 3 && <span className="text-[0.75rem] text-ink-500">+{order.items.length - 3}</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (order) => <StatusPill status={order.status} /> },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (order) => <span className="font-semibold text-ink-900">{formatPrice(order.total)}</span>,
    },
    {
      key: "placed",
      header: "Placed",
      align: "right",
      hideBelow: "lg",
      cell: (order) => <span className="text-[0.78rem] text-ink-500">{formatDate(order.placedAt)}</span>,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={user.name}
        description={`${user.email} · joined ${formatDate(user.createdAt)}`}
        breadcrumb={[{ label: "Customers", href: "/admin/customers" }, { label: user.name }]}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={user.status === "ACTIVE" ? "brand" : "rose"}>
              {user.status === "ACTIVE" ? "Active" : "Suspended"}
            </Badge>
            <RoleSelect userId={user.id} role={user.role} />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lifetime spend" value={formatCompactPrice(spend)} />
        <StatCard label="Orders placed" value={String(orders.length)} tone="ocean" hint={`${cancelled} cancelled`} />
        <StatCard
          label="Average order"
          value={formatCompactPrice(orders.length ? spend / Math.max(1, orders.length - cancelled) : 0)}
          tone="brand"
        />
        <StatCard label="Saved addresses" value={String(addresses.length)} tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <AdminPanel title="Order history" description={`${orders.length} orders on record`} padded={false}>
            <div className="p-4 sm:p-5">
              <DataTable rows={orders.slice(0, 12)} columns={orderColumns} emptyMessage="This customer has not ordered yet" />
            </div>
          </AdminPanel>

          <AdminPanel title="Notifications sent" padded={false}>
            {notifications.length === 0 ? (
              <p className="p-5 text-[0.84rem] text-ink-500">No notifications have been sent to this customer.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.map((notification) => (
                  <li key={notification.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500">
                      <Bell className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.83rem] font-semibold text-ink-900">{notification.title}</span>
                      <span className="mt-0.5 block text-[0.79rem] text-ink-600">{notification.body}</span>
                      <span className="mt-1 block text-[0.72rem] text-ink-400">
                        {formatDateTime(notification.createdAt)} · {notification.read ? "read" : "unread"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-5">
          <AdminPanel title="Contact details">
            <ul className="space-y-2.5 text-[0.83rem] text-ink-700">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-ink-400" /> {user.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-ink-400" /> {user.phone ?? "No phone on file"}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-ink-400" /> {addresses.length} saved address
                {addresses.length === 1 ? "" : "es"}
              </li>
            </ul>

            <div className="mt-4 border-t border-ink-100 pt-3">
              <UserStatusForm userId={user.id} status={user.status} />
            </div>
          </AdminPanel>

          <AdminPanel title="Send a notification">
            <form action={notifyUserAction} className="space-y-3">
              <input type="hidden" name="userId" value={user.id} />
              <Field label="Title" htmlFor="title">
                <Input id="title" name="title" defaultValue="A note from SoftDealz" />
              </Field>
              <Field label="Message" htmlFor="body" required>
                <Textarea id="body" name="body" rows={4} required placeholder="Write something helpful…" />
              </Field>
              <Button type="submit" size="sm" fullWidth>
                <Send className="size-3.5" /> Send notification
              </Button>
            </form>
          </AdminPanel>

          {addresses.length > 0 && (
            <AdminPanel title="Saved addresses" padded={false}>
              <ul className="divide-y divide-ink-100">
                {addresses.map((address) => (
                  <li key={address.id} className="px-4 py-3.5">
                    <p className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink-900">
                      {address.label}
                      {address.isDefault && <Badge tone="brand" size="sm">Default</Badge>}
                    </p>
                    <p className="mt-1 text-[0.79rem] leading-relaxed text-ink-600">
                      {address.fullName}
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          )}

          <div className="card-surface p-4">
            <p className="text-[0.8rem] font-semibold text-ink-700">Account footer</p>
            <p className="mt-1 text-[0.76rem] text-ink-500">
              {initials(user.name)} · member since {formatDate(user.createdAt)} · email{" "}
              {user.emailVerified ? "verified" : "unverified"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
