import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Boxes, Minus, Plus } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, type Column } from "@/components/admin/kit";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { adjustStockAction } from "@/app/actions/admin";
import { all } from "@/lib/db";
import { mapProduct } from "@/lib/data/mappers";
import { formatCompactPrice, formatNumber } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "attention", label: "Needs attention" },
  { id: "out", label: "Out of stock" },
  { id: "all", label: "All stock" },
];

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view = "attention", q } = await searchParams;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (view === "attention") conditions.push("p.stock <= p.low_stock_alert");
  if (view === "out") conditions.push("p.stock = 0");
  if (q) {
    conditions.push("(LOWER(p.title) LIKE ? OR LOWER(p.sku) LIKE ?)");
    params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const products: Product[] = all(
    `SELECT p.* FROM products p ${where} ORDER BY p.stock ASC, p.title ASC LIMIT 60`,
    params,
  ).map(mapProduct);

  const totals = all(
    `SELECT
        COUNT(*) AS products,
        COALESCE(SUM(stock), 0) AS units,
        COALESCE(SUM(stock * price), 0) AS value,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN stock <= low_stock_alert AND stock > 0 THEN 1 ELSE 0 END) AS low
     FROM products`,
  )[0] as Record<string, number>;

  const columns: Array<Column<Product>> = [
    {
      key: "product",
      header: "Product",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
            <Image
              src={row.images[0] ?? "/images/products/placeholder.svg"}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/products/${row.id}`}
              className="line-clamp-2-safe block text-[0.83rem] font-medium text-ink-900 hover:text-brand-700"
            >
              {row.title}
            </Link>
            <span className="mt-0.5 block font-mono text-[0.7rem] text-ink-500">{row.sku}</span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1.5">
          <Badge tone={row.stock === 0 ? "rose" : row.stock <= row.lowStockAlert ? "amber" : "brand"}>
            {row.stock === 0 ? "Out of stock" : row.stock <= row.lowStockAlert ? "Low stock" : "Healthy"}
          </Badge>
        </span>
      ),
    },
    {
      key: "stock",
      header: "On hand",
      align: "right",
      cell: (row) => (
        <span
          className={
            row.stock === 0
              ? "text-fluid-lg font-extrabold text-rose-brand"
              : row.stock <= row.lowStockAlert
                ? "text-fluid-lg font-extrabold text-amber-600"
                : "text-fluid-lg font-extrabold text-ink-900"
          }
        >
          {row.stock}
        </span>
      ),
    },
    {
      key: "value",
      header: "Stock value",
      align: "right",
      hideBelow: "lg",
      cell: (row) => <span className="text-ink-600">{formatCompactPrice(row.stock * row.price)}</span>,
    },
    {
      key: "adjust",
      header: "Adjust",
      align: "right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-1.5">
          <form action={adjustStockAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="delta" value="-1" />
            <button
              type="submit"
              aria-label={`Remove one ${row.title}`}
              className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-rose-300 hover:text-rose-brand"
            >
              <Minus className="size-3.5" />
            </button>
          </form>
          <form action={adjustStockAction} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={row.id} />
            <input
              type="number"
              name="stock"
              defaultValue={row.stock}
              min="0"
              aria-label={`Set stock for ${row.title}`}
              className="h-8 w-16 rounded-lg border border-ink-300 px-2 text-center text-[0.8rem] focus:border-brand-600 focus:outline-none"
            />
            <button
              type="submit"
              className="h-8 rounded-lg bg-ink-900 px-2.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800"
            >
              Set
            </button>
          </form>
          <form action={adjustStockAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="delta" value="1" />
            <button
              type="submit"
              aria-label={`Add one ${row.title}`}
              className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              <Plus className="size-3.5" />
            </button>
          </form>
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Track stock levels and restock the products that need it."
        action={
          <ButtonLink href="/admin/products?sort=stock" variant="outline" size="sm">
            <Boxes className="size-4" /> Full product list
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Products tracked", value: formatNumber(totals.products ?? 0), tone: "text-ink-900" },
          { label: "Units on hand", value: formatNumber(totals.units ?? 0), tone: "text-ink-900" },
          { label: "Stock value", value: formatCompactPrice(totals.value ?? 0), tone: "text-brand-700" },
          {
            label: "Out of stock",
            value: formatNumber(totals.out_of_stock ?? 0),
            tone: Number(totals.out_of_stock ?? 0) > 0 ? "text-rose-brand" : "text-ink-900",
          },
        ].map((stat) => (
          <div key={stat.label} className="card-surface p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-500">{stat.label}</p>
            <p className={`mt-1.5 text-fluid-2xl font-extrabold ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <AdminPanel padded={false}>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-ink-200 p-4 sm:p-5">
            {TABS.map((tab) => {
              const active = tab.id === view;
              return (
                <Link
                  key={tab.id}
                  href={`/admin/inventory?view=${tab.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}

            <form action="/admin/inventory" method="get" className="ml-auto flex items-center gap-2">
              <input type="hidden" name="view" value={view} />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Find a product…"
                aria-label="Search inventory"
                className="h-10 w-48 rounded-xl border border-ink-300 px-3.5 text-[0.83rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
              />
              <button
                type="submit"
                className="h-10 rounded-xl bg-ink-900 px-3.5 text-[0.82rem] font-semibold text-white hover:bg-ink-800"
              >
                Find
              </button>
            </form>
          </div>

          <div className="p-4 sm:p-5">
            <DataTable
              rows={products}
              columns={columns}
              emptyMessage={view === "attention" ? "Everything is well stocked" : "No products found"}
              caption="Inventory"
            />
          </div>

          <p className="border-t border-ink-100 px-4 py-3 text-[0.75rem] text-ink-500 sm:px-5">
            Out of stock products stay visible with an “Out of stock” badge. Adjustments apply immediately across the
            storefront.
          </p>
        </AdminPanel>
      </div>
    </>
  );
}
