import { all, get } from "@/lib/db";
import { newId, run } from "@/lib/db";
import { mapProduct } from "@/lib/data/mappers";

export interface KpiSet {
  revenue: number;
  revenuePrev: number;
  orders: number;
  ordersPrev: number;
  customers: number;
  customersPrev: number;
  products: number;
  avgOrderValue: number;
  conversionRate: number;
  lowStock: number;
  pendingOrders: number;
  reviewsPending: number;
}

const PAID_STATUSES = "'PAID'";

function sum(sql: string, params: unknown[] = []): number {
  const row = get<{ value: number | null }>(sql, params);
  return Number(row?.value ?? 0);
}

export function kpis(): KpiSet {
  const revenue = sum(
    `SELECT SUM(total) AS value FROM orders
      WHERE status NOT IN ('CANCELLED','REFUNDED')`,
  );
  const revenuePrev = sum(
    `SELECT SUM(total) AS value FROM orders
      WHERE status NOT IN ('CANCELLED','REFUNDED')
        AND placed_at < datetime('now', '-30 days')`,
  );
  const orders = sum("SELECT COUNT(*) AS value FROM orders");
  const ordersPrev = sum(
    "SELECT COUNT(*) AS value FROM orders WHERE placed_at < datetime('now', '-30 days')",
  );
  const customers = sum("SELECT COUNT(*) AS value FROM users WHERE role = 'CUSTOMER'");
  const customersPrev = sum(
    "SELECT COUNT(*) AS value FROM users WHERE role = 'CUSTOMER' AND created_at < datetime('now', '-30 days')",
  );
  const products = sum("SELECT COUNT(*) AS value FROM products");
  const pendingOrders = sum("SELECT COUNT(*) AS value FROM orders WHERE status = 'PENDING'");
  const reviewsPending = sum("SELECT COUNT(*) AS value FROM reviews WHERE status = 'PENDING'");
  const lowStock = sum(
    "SELECT COUNT(*) AS value FROM products WHERE stock <= low_stock_alert AND status = 'ACTIVE'",
  );
  const views = sum("SELECT SUM(view_count) AS value FROM products");

  return {
    revenue,
    revenuePrev,
    orders,
    ordersPrev,
    customers,
    customersPrev,
    products,
    avgOrderValue: orders > 0 ? revenue / orders : 0,
    conversionRate: views > 0 ? (orders / views) * 100 : 0,
    lowStock,
    pendingOrders,
    reviewsPending,
  };
}

export function deltaPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export interface SeriesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

/** Revenue + order counts per day for the last `days` days (gaps filled with 0). */
export function salesSeries(days = 30): SeriesPoint[] {
  const rows = all<{ day: string; revenue: number; orders: number }>(
    `SELECT date(placed_at) AS day, SUM(total) AS revenue, COUNT(*) AS orders
       FROM orders
      WHERE placed_at >= datetime('now', ?)
      GROUP BY day ORDER BY day ASC`,
    [`-${days} days`],
  );
  const byDay = new Map(rows.map((row) => [String(row.day), row]));
  const series: SeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const found = byDay.get(key);
    series.push({
      date: key,
      label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      revenue: Number(found?.revenue ?? 0),
      orders: Number(found?.orders ?? 0),
    });
  }
  return series;
}

export function categoryBreakdown(limit = 8): Array<{ name: string; revenue: number; units: number }> {
  const rows = all(
    `SELECT c.name AS name,
            SUM(oi.total) AS revenue,
            SUM(oi.quantity) AS units
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
      WHERE o.status NOT IN ('CANCELLED','REFUNDED')
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    name: String(row.name),
    revenue: Number(row.revenue ?? 0),
    units: Number(row.units ?? 0),
  }));
}

export function topProducts(limit = 6): Array<{
  id: string;
  title: string;
  slug: string;
  image: string;
  units: number;
  revenue: number;
  stock: number;
}> {
  const rows = all(
    `SELECT p.id, p.title, p.slug, p.images, p.stock,
            SUM(oi.quantity) AS units, SUM(oi.total) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('CANCELLED','REFUNDED')
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map((row) => {
    let image = "/images/products/placeholder.svg";
    try {
      const parsed = JSON.parse(String(row.images ?? "[]")) as string[];
      image = parsed[0] ?? image;
    } catch {
      /* keep placeholder */
    }
    return {
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      image,
      units: Number(row.units ?? 0),
      revenue: Number(row.revenue ?? 0),
      stock: Number(row.stock ?? 0),
    };
  });
}

export function recentOrders(limit = 8) {
  return all(
    `SELECT id, order_number, customer_name, email, status, payment_status, total, placed_at
       FROM orders ORDER BY placed_at DESC LIMIT ?`,
    [limit],
  ).map((row) => ({
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    email: String(row.email),
    status: String(row.status),
    paymentStatus: String(row.payment_status),
    total: Number(row.total),
    placedAt: String(row.placed_at),
  }));
}

export function lowStockList(limit = 6) {
  return all(
    `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.stock <= p.low_stock_alert AND p.status = 'ACTIVE'
      ORDER BY p.stock ASC LIMIT ?`,
    [limit],
  ).map(mapProduct);
}

export function customerGrowth(days = 30): Array<{ label: string; customers: number }> {
  const rows = all<{ day: string; total: number }>(
    `SELECT date(created_at) AS day, COUNT(*) AS total FROM users
      WHERE role = 'CUSTOMER' AND created_at >= datetime('now', ?)
      GROUP BY day ORDER BY day ASC`,
    [`-${days} days`],
  );
  const byDay = new Map(rows.map((row) => [String(row.day), Number(row.total)]));
  const out: Array<{ label: string; customers: number }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    out.push({
      label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      customers: byDay.get(key) ?? 0,
    });
  }
  return out;
}

export function revenueByPaymentMethod() {
  return all(
    `SELECT payment_method AS method, SUM(total) AS revenue, COUNT(*) AS orders
       FROM orders WHERE status NOT IN ('CANCELLED','REFUNDED')
      GROUP BY payment_method`,
  ).map((row) => ({
    method: String(row.method),
    revenue: Number(row.revenue ?? 0),
    orders: Number(row.orders ?? 0),
  }));
}

export function searchTerms(limit = 8): Array<{ term: string; hits: number }> {
  return all(
    `SELECT term, COUNT(*) AS hits FROM search_log GROUP BY term ORDER BY hits DESC LIMIT ?`,
    [limit],
  ).map((row) => ({ term: String(row.term), hits: Number(row.hits ?? 0) }));
}

export function logSearch(term: string) {
  const clean = term.trim().toLowerCase().slice(0, 80);
  if (clean.length < 2) return;
  run(
    `INSERT INTO search_log (id, term, created_at) VALUES (?, ?, datetime('now'))`,
    [newId("slog"), clean],
  );
}

export function salesSummary(period: "7d" | "30d" | "12m") {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 365;
  const series = salesSeries(days);
  const revenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const orders = series.reduce((sum, point) => sum + point.orders, 0);
  return {
    period,
    series,
    revenue,
    orders,
    avgOrderValue: orders ? revenue / orders : 0,
  };
}

export { PAID_STATUSES };
