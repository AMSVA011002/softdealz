import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Percent,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  BarChart,
  DonutChart,
  Sparkline,
} from "@/components/admin/charts";
import { AdminPageHeader, AdminPanel, DataTable, MiniBar, StatCard, type Column } from "@/components/admin/kit";
import { StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  categoryBreakdown,
  customerGrowth,
  deltaPercent,
  kpis,
  lowStockList,
  recentOrders,
  revenueByPaymentMethod,
  salesSeries,
  searchTerms,
  topProducts,
} from "@/lib/data/analytics";
import { formatCompactPrice, formatNumber, formatPrice, timeAgo } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
];

const DONUT_COLORS = ["#0c800f", "#0a57a0", "#16a34a", "#2563eb", "#65a30d", "#0ea5e9", "#a3e635", "#7dd3fc"];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30" } = await searchParams;
  const active = RANGES.find((entry) => entry.id === range) ?? RANGES[1];
  const days = active.days;

  const stats = kpis();
  const series = salesSeries(days);
  const growth = customerGrowth(days);
  const categories = categoryBreakdown(8);
  const top = topProducts(5);
  const orders = recentOrders(6);
  const lowStock = lowStockList(5);
  const payments = revenueByPaymentMethod();
  const terms = searchTerms(6);

  const rangeRevenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const rangeOrders = series.reduce((sum, point) => sum + point.orders, 0);

  const chartData = series.map((point) => ({
    label: point.label,
    value: point.revenue,
    secondary: point.orders,
  }));

  const newCustomers = growth.reduce((sum, point) => sum + point.customers, 0);

  const paymentTotal = payments.reduce((sum, entry) => sum + entry.revenue, 0);
  const paymentSlices = payments.map((entry, index) => ({
    label: entry.method === "COD" ? "Cash on delivery" : entry.method === "CARD" ? "Card" : entry.method,
    value: entry.revenue,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));

  const orderColumns: Array<Column<(typeof orders)[number]>> = [
    {
      key: "order",
      header: "Order",
      cell: (row) => (
        <Link href={`/admin/orders/${row.id}`} className="font-mono text-[0.82rem] font-bold text-ink-900 hover:text-brand-700">
          {row.orderNumber}
        </Link>
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
    { key: "status", header: "Status", cell: (row) => <StatusPill status={row.status as OrderStatus} /> },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (row) => <span className="font-semibold text-ink-900">{formatPrice(row.total)}</span>,
    },
    {
      key: "placed",
      header: "Placed",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="text-[0.78rem] text-ink-500">{timeAgo(row.placedAt)}</span>,
    },
  ];

  const stockColumns: Array<Column<(typeof lowStock)[number]>> = [
    {
      key: "product",
      header: "Product",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-ink-100">
            <Image
              src={row.images[0] ?? "/images/products/placeholder.svg"}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </span>
          <Link href={`/admin/products/${row.id}`} className="line-clamp-2-safe text-[0.83rem] font-medium text-ink-900 hover:text-brand-700">
            {row.title}
          </Link>
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (row) => (
        <span className={row.stock === 0 ? "font-bold text-rose-brand" : "font-bold text-amber-600"}>
          {row.stock}
        </span>
      ),
    },
    {
      key: "threshold",
      header: "Alert at",
      align: "right",
      hideBelow: "sm",
      cell: (row) => <span className="text-ink-500">{row.lowStockAlert}</span>,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Store health at a glance — sales, catalogue and fulfilment."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-ink-200 bg-white p-0.5">
              {RANGES.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/admin?range=${entry.id}`}
                  aria-current={entry.id === active.id ? "page" : undefined}
                  className={`rounded-[0.65rem] px-3 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                    entry.id === active.id ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
                  }`}
                >
                  {entry.label}
                </Link>
              ))}
            </div>
            <ButtonLink href="/admin/products/new" size="sm">
              Add product
            </ButtonLink>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (all time)"
          value={formatCompactPrice(stats.revenue)}
          delta={deltaPercent(stats.revenue, stats.revenuePrev)}
          hint={`${formatCompactPrice(rangeRevenue)} in the last ${days} days`}
          icon={<Wallet className="size-5" />}
          tone="brand"
          sparkline={<Sparkline values={series.map((point) => point.revenue)} />}
        />
        <StatCard
          label="Orders"
          value={formatNumber(stats.orders)}
          delta={deltaPercent(stats.orders, stats.ordersPrev)}
          hint={`${formatNumber(rangeOrders)} orders in period`}
          icon={<ShoppingCart className="size-5" />}
          tone="ocean"
          sparkline={<Sparkline values={series.map((point) => point.orders)} color="#0a57a0" />}
        />
        <StatCard
          label="Customers"
          value={formatNumber(stats.customers)}
          delta={deltaPercent(stats.customers, stats.customersPrev)}
          hint={`${newCustomers} joined in the last ${days} days`}
          icon={<Users className="size-5" />}
          tone="brand"
          sparkline={<Sparkline values={growth.map((point) => point.customers)} />}
        />
        <StatCard
          label="Avg. order value"
          value={formatPrice(stats.avgOrderValue)}
          hint={`${formatNumber(stats.products)} products live`}
          icon={<TrendingUp className="size-5" />}
          tone="ocean"
        />
      </div>

      {/* attention strip */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/admin/orders?status=PENDING",
            icon: <ShoppingCart className="size-4" />,
            value: stats.pendingOrders,
            label: "orders awaiting fulfilment",
            tone: "bg-amber-50 text-amber-700",
          },
          {
            href: "/admin/inventory",
            icon: <AlertTriangle className="size-4" />,
            value: stats.lowStock,
            label: "products low on stock",
            tone: "bg-rose-50 text-rose-700",
          },
          {
            href: "/admin/reviews?status=PENDING",
            icon: <Star className="size-4" />,
            value: stats.reviewsPending,
            label: "reviews waiting moderation",
            tone: "bg-ocean-50 text-ocean-700",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card-surface flex items-center gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.tone}`}>{item.icon}</span>
            <span className="min-w-0">
              <span className="text-fluid-lg font-extrabold text-ink-900">{item.value}</span>
              <span className="ml-1.5 text-[0.8rem] text-ink-500">{item.label}</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-ink-300" />
          </Link>
        ))}
      </div>

      {/* revenue chart + payment split */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminPanel
          title={`Revenue — last ${days} days`}
          description={`Solid line is revenue, dashed line is order count. Total ${formatCompactPrice(rangeRevenue)}.`}
        >
          <AreaChart data={chartData} height={260} showSecondary format="price" />
        </AdminPanel>

        <AdminPanel
          title="Revenue by payment method"
          description={`${formatCompactPrice(paymentTotal)} collected`}
        >
          {paymentSlices.length === 0 ? (
            <p className="py-8 text-center text-[0.85rem] text-ink-400">No payments recorded yet.</p>
          ) : (
            <DonutChart
              data={paymentSlices}
              centreValue={formatCompactPrice(paymentTotal)}
              centreLabel="Total"
            />
          )}
        </AdminPanel>
      </div>

      {/* categories + top products */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminPanel title="Revenue by department" description="Top categories by sales value">
          <BarChart
            data={categories.map((entry) => ({ label: entry.name, value: entry.revenue }))}
            format="compactPrice"
          />
          <ul className="mt-4 space-y-2.5">
            {categories.slice(0, 5).map((entry) => (
              <li key={entry.name} className="flex items-center justify-between gap-3 text-[0.83rem]">
                <span className="min-w-0 truncate text-ink-700">{entry.name}</span>
                <span className="shrink-0">
                  <MiniBar value={entry.units} max={Math.max(...categories.map((row) => row.units))} tone="ocean" />
                </span>
                <span className="w-24 shrink-0 text-right font-semibold text-ink-900">
                  {formatCompactPrice(entry.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel
          title="Best sellers"
          description="By revenue in the selected period window"
          action={
            <Link href="/admin/products" className="text-[0.8rem] font-semibold text-brand-700 hover:underline">
              All products
            </Link>
          }
          padded={false}
        >
          <ul className="divide-y divide-ink-100">
            {top.map((product, index) => (
              <li key={product.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
                <span className="w-5 shrink-0 text-[0.85rem] font-extrabold text-ink-300">#{index + 1}</span>
                <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  <Image src={product.image} alt="" fill sizes="44px" className="object-cover" unoptimized />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="line-clamp-1 text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
                  >
                    {product.title}
                  </Link>
                  <span className="mt-0.5 block text-[0.74rem] text-ink-500">
                    {product.units} sold · {product.stock} in stock
                  </span>
                </span>
                <span className="shrink-0 text-[0.85rem] font-bold text-brand-700">
                  {formatCompactPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>

      {/* recent orders + low stock */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AdminPanel
          title="Latest orders"
          description="Most recent activity across the store"
          action={
            <Link href="/admin/orders" className="text-[0.8rem] font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          }
        >
          <DataTable rows={orders} columns={orderColumns} emptyMessage="No orders yet" caption="Latest orders" />
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel
            title="Low stock"
            description="Reorder soon to avoid missing sales"
            action={
              <Link href="/admin/inventory" className="text-[0.8rem] font-semibold text-brand-700 hover:underline">
                Manage
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <p className="flex items-center gap-2 py-4 text-[0.84rem] text-brand-700">
                <Boxes className="size-4" /> Every product is comfortably stocked.
              </p>
            ) : (
              <DataTable rows={lowStock} columns={stockColumns} emptyMessage="Nothing low on stock" />
            )}
          </AdminPanel>

          <AdminPanel title="Top searches" description="What shoppers are looking for right now">
            {terms.length === 0 ? (
              <p className="py-3 text-[0.84rem] text-ink-400">No searches logged yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {terms.map((entry) => (
                  <li key={entry.term}>
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(entry.term)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[0.8rem] text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                    >
                      {entry.term}
                      <span className="text-[0.72rem] text-ink-400">{entry.hits}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Coupon performance" description="Discount codes in circulation">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[0.84rem] text-ink-600">
                <Percent className="size-4 text-brand-600" />
                Manage codes, limits and expiry on the coupons screen.
              </p>
              <ButtonLink href="/admin/coupons" variant="outline" size="sm" fullWidth>
                Open coupons
              </ButtonLink>
            </div>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
