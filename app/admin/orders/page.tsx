import type { Metadata } from "next";
import Link from "next/link";
import { Download, ShoppingCart } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, type Column } from "@/components/admin/kit";
import { StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/nav";
import { intParam } from "@/lib/params";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { listOrdersAdmin, ordersByStatus, countOrders } from "@/lib/data/orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUSES: Array<{ id: string; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "REFUNDED", label: "Refunded" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; payment?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const page = intParam(params.page, 1, { min: 1, max: 10_000 });
  const status = params.status ?? "ALL";

  const result = listOrdersAdmin({
    q: params.q,
    status,
    paymentStatus: params.payment,
    page,
    perPage: 20,
  });

  const counts = new Map(ordersByStatus().map((entry) => [entry.status, entry.count]));
  const total = countOrders();

  const hrefTemplate = (() => {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (status !== "ALL") next.set("status", status);
    if (params.payment) next.set("payment", params.payment);
    const search = next.toString();
    return `/admin/orders${search ? `?${search}&page={page}` : "?page={page}"}`;
  })();

  const columns: Array<Column<Order>> = [
    {
      key: "order",
      header: "Order",
      cell: (row) => (
        <span className="block">
          <Link
            href={`/admin/orders/${row.id}`}
            className="font-mono text-[0.82rem] font-bold text-ink-900 hover:text-brand-700"
          >
            {row.orderNumber}
          </Link>
          <span className="mt-0.5 block text-[0.72rem] text-ink-500">{formatDateTime(row.placedAt)}</span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <span className="block">
          <span className="block text-[0.83rem] font-medium text-ink-900">{row.customerName}</span>
          <span className="block text-[0.72rem] text-ink-500">{row.email}</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      hideBelow: "lg",
      cell: (row) => <span className="text-ink-600">{row.items.length}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <StatusPill status={row.paymentStatus} />
          <span className="text-[0.7rem] text-ink-500">
            {row.paymentMethod === "COD" ? "Cash on delivery" : row.paymentMethod}
          </span>
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (row) => <span className="font-semibold text-ink-900">{formatPrice(row.total)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <OrderStatusForm orderId={row.id} status={row.status} compact />,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description={`${total} orders in total · ${result.total} match the current filter`}
        action={
          <ButtonLink href="/admin/orders?status=PENDING" variant="outline" size="sm">
            <ShoppingCart className="size-4" /> Pending queue
          </ButtonLink>
        }
      />

      {params.updated === "1" && (
        <div className="mb-4">
          <Alert tone="success" title="Order updated">
            The customer&apos;s tracking timeline has been refreshed.
          </Alert>
        </div>
      )}

      <AdminPanel padded={false}>
        <div className="space-y-4 border-b border-ink-200 p-4 sm:p-5">
          <form action="/admin/orders" method="get" className="flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search order number, name or email…"
              aria-label="Search orders"
              className="h-10 min-w-[14rem] flex-1 rounded-xl border border-ink-300 px-3.5 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:max-w-sm"
            />
            <select
              name="payment"
              defaultValue={params.payment ?? ""}
              aria-label="Filter by payment status"
              className="h-10 rounded-xl border border-ink-300 px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none"
            >
              <option value="">Any payment</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            {status !== "ALL" && <input type="hidden" name="status" value={status} />}
            <button
              type="submit"
              className="h-10 rounded-xl bg-brand-600 px-4 text-[0.84rem] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {STATUSES.map((entry) => {
              const active = entry.id === status;
              const next = new URLSearchParams();
              if (params.q) next.set("q", params.q);
              if (params.payment) next.set("payment", params.payment);
              if (entry.id !== "ALL") next.set("status", entry.id);
              const search = next.toString();
              const count = entry.id === "ALL" ? total : (counts.get(entry.id) ?? 0);

              return (
                <Link
                  key={entry.id}
                  href={`/admin/orders${search ? `?${search}` : ""}`}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  {entry.label}
                  <span className={`ml-1.5 text-[0.72rem] ${active ? "text-white/75" : "text-ink-400"}`}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <DataTable rows={result.items} columns={columns} emptyMessage="No orders match this filter" caption="Orders" />
        </div>

        {result.totalPages > 1 && (
          <div className="border-t border-ink-200 px-4 py-4 sm:px-5">
            <Pagination page={result.page} totalPages={result.totalPages} hrefTemplate={hrefTemplate} className="justify-center" />
          </div>
        )}

        <p className="flex items-center gap-1.5 border-t border-ink-100 px-4 py-3 text-[0.75rem] text-ink-500 sm:px-5">
          <Download className="size-3.5" /> Status changes notify the customer and update their tracking page instantly.
        </p>
      </AdminPanel>
    </>
  );
}
