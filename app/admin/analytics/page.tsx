import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search, Target, TrendingUp, Users } from "lucide-react";
import { AreaChart, BarChart, DonutChart, Sparkline } from "@/components/admin/charts";
import { AdminPageHeader, AdminPanel, MiniBar, StatCard } from "@/components/admin/kit";
import {
  categoryBreakdown,
  customerGrowth,
  deltaPercent,
  kpis,
  revenueByPaymentMethod,
  salesSeries,
  searchTerms,
  topProducts,
} from "@/lib/data/analytics";
import { all } from "@/lib/db";
import { formatCompactPrice, formatNumber, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "365", label: "12 months", days: 365 },
];

const DONUT_COLORS = ["#0c800f", "#0a57a0", "#16a34a", "#2563eb", "#65a30d", "#0ea5e9"];

export default async function AdminAnalyticsPage({
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
  const top = topProducts(8);
  const payments = revenueByPaymentMethod();
  const terms = searchTerms(12);

  const revenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const orders = series.reduce((sum, point) => sum + point.orders, 0);
  const newCustomers = growth.reduce((sum, point) => sum + point.customers, 0);
  const bestDay = series.reduce((best, point) => (point.revenue > best.revenue ? point : best), series[0]);

  const statusRows = all(
    "SELECT status, COUNT(*) AS total FROM orders GROUP BY status ORDER BY total DESC",
  ).map((row) => ({ label: String(row.status), value: Number(row.total) }));

  const paymentSlices = payments.map((entry, index) => ({
    label: entry.method === "COD" ? "Cash on delivery" : entry.method === "CARD" ? "Card" : entry.method,
    value: entry.revenue,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));

  const hourRows = all(
    `SELECT CAST(strftime('%H', placed_at) AS INTEGER) AS hour, COUNT(*) AS total
       FROM orders GROUP BY hour ORDER BY hour ASC`,
  ).map((row) => ({ label: `${String(row.hour).padStart(2, "0")}:00`, value: Number(row.total) }));

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Sales, traffic and catalogue performance over time."
        action={
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-200 bg-white p-0.5">
            {RANGES.map((entry) => (
              <Link
                key={entry.id}
                href={`/admin/analytics?range=${entry.id}`}
                aria-current={entry.id === active.id ? "page" : undefined}
                className={`rounded-[0.65rem] px-3 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                  entry.id === active.id ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
              >
                {entry.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue · ${active.label}`}
          value={formatCompactPrice(revenue)}
          delta={deltaPercent(stats.revenue, stats.revenuePrev)}
          hint={`${formatCompactPrice(stats.revenue)} all time`}
          icon={<TrendingUp className="size-5" />}
          sparkline={<Sparkline values={series.map((point) => point.revenue)} />}
        />
        <StatCard
          label="Orders"
          value={formatNumber(orders)}
          delta={deltaPercent(stats.orders, stats.ordersPrev)}
          hint={`AOV ${formatPrice(orders ? revenue / orders : 0)}`}
          icon={<Target className="size-5" />}
          tone="ocean"
          sparkline={<Sparkline values={series.map((point) => point.orders)} color="#0a57a0" />}
        />
        <StatCard
          label="New customers"
          value={formatNumber(newCustomers)}
          delta={deltaPercent(stats.customers, stats.customersPrev)}
          hint={`${formatNumber(stats.customers)} total shoppers`}
          icon={<Users className="size-5" />}
          sparkline={<Sparkline values={growth.map((point) => point.customers)} />}
        />
        <StatCard
          label="Best day"
          value={bestDay ? formatCompactPrice(bestDay.revenue) : "—"}
          hint={bestDay ? `${bestDay.label} · ${bestDay.orders} orders` : "No sales in range"}
          icon={<ArrowUpRight className="size-5" />}
          tone="amber"
        />
      </div>

      <div className="mt-5">
        <AdminPanel
          title="Revenue and order volume"
          description="Solid line = revenue (LKR), dashed line = number of orders"
        >
          <AreaChart
            data={series.map((point) => ({ label: point.label, value: point.revenue, secondary: point.orders }))}
            height={300}
            showSecondary
            format="price"
          />
        </AdminPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <AdminPanel title="Revenue by department" description="Where the money comes from">
          <BarChart
            data={categories.map((entry) => ({ label: entry.name, value: entry.revenue }))}
            format="compactPrice"
            height={250}
          />
          <ul className="mt-5 space-y-2.5">
            {categories.map((entry) => (
              <li key={entry.name} className="flex items-center gap-3 text-[0.83rem]">
                <span className="min-w-0 flex-1 truncate text-ink-700">{entry.name}</span>
                <MiniBar value={entry.units} max={Math.max(...categories.map((row) => row.units), 1)} tone="ocean" />
                <span className="w-24 shrink-0 text-right font-semibold text-ink-900">
                  {formatCompactPrice(entry.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel title="Payment methods" description={`${formatCompactPrice(payments.reduce((s, e) => s + e.revenue, 0))} collected`}>
            {paymentSlices.length === 0 ? (
              <p className="py-6 text-center text-[0.85rem] text-ink-400">No payments recorded yet.</p>
            ) : (
              <DonutChart data={paymentSlices} size={180} thickness={24} />
            )}
          </AdminPanel>

          <AdminPanel title="Orders by status" description="Fulfilment pipeline">
            <BarChart data={statusRows} color="#0c800f" height={160} />
          </AdminPanel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <AdminPanel title="Top products" description="Ranked by revenue" className="xl:col-span-2" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left">
              <thead>
                <tr className="border-b border-ink-200">
                  <th scope="col" className="px-4 py-2.5 text-[0.72rem] font-bold uppercase tracking-wide text-ink-500 sm:px-5">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[0.72rem] font-bold uppercase tracking-wide text-ink-500">
                    Units
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[0.72rem] font-bold uppercase tracking-wide text-ink-500">
                    Revenue
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[0.72rem] font-bold uppercase tracking-wide text-ink-500 sm:px-5">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {top.map((product, index) => (
                  <tr key={product.id} className="hover:bg-ink-50/70">
                    <td className="px-4 py-3 sm:px-5">
                      <span className="flex items-center gap-3">
                        <span className="w-4 shrink-0 text-[0.78rem] font-bold text-ink-300">{index + 1}</span>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="line-clamp-2-safe text-[0.83rem] font-medium text-ink-900 hover:text-brand-700"
                        >
                          {product.title}
                        </Link>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-[0.83rem] text-ink-700">{formatNumber(product.units)}</td>
                    <td className="px-3 py-3 text-right text-[0.83rem] font-semibold text-brand-700">
                      {formatCompactPrice(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-[0.83rem] sm:px-5">
                      <span className={product.stock <= 5 ? "font-bold text-amber-600" : "text-ink-600"}>
                        {product.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel title="Search terms" description="Logged from the storefront search bar">
            {terms.length === 0 ? (
              <p className="text-[0.84rem] text-ink-400">No searches logged yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {terms.map((entry) => (
                  <li key={entry.term} className="flex items-center gap-2.5 text-[0.83rem]">
                    <Search className="size-3.5 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate text-ink-700">{entry.term}</span>
                    <span className="shrink-0 font-semibold text-ink-500">{entry.hits}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Ordering hours" description="When shoppers buy">
            <BarChart data={hourRows} height={150} />
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
