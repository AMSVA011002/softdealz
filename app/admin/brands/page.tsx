import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, MiniBar, type Column } from "@/components/admin/kit";
import { BrandManager } from "@/components/admin/brand-manager";
import { Alert } from "@/components/ui/feedback";
import { all } from "@/lib/db";
import { formatCompactPrice, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Brands",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  productCount: number;
  revenue: number;
}

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; deleted?: string }>;
}) {
  const { blocked, deleted } = await searchParams;

  const brands: BrandRow[] = all(
    `SELECT b.id, b.name, b.slug, b.logo,
            (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE') AS product_count,
            COALESCE((
              SELECT SUM(oi.total) FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                JOIN products p2 ON p2.id = oi.product_id
               WHERE p2.brand_id = b.id AND o.status NOT IN ('CANCELLED','REFUNDED')
            ), 0) AS revenue
       FROM brands b
      ORDER BY product_count DESC, b.name ASC`,
  ).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logo: (row.logo as string | null) ?? null,
    productCount: Number(row.product_count ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));

  const maxProducts = Math.max(...brands.map((brand) => brand.productCount), 1);

  const columns: Array<Column<BrandRow>> = [
    {
      key: "brand",
      header: "Brand",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white">
            {row.logo ? (
              <Image src={row.logo} alt="" fill sizes="40px" className="object-contain p-1" unoptimized />
            ) : (
              <span className="text-[0.8rem] font-bold text-ink-400">{row.name.charAt(0)}</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.84rem] font-medium text-ink-900">{row.name}</span>
            <span className="block font-mono text-[0.72rem] text-ink-500">/{row.slug}</span>
          </span>
        </span>
      ),
    },
    {
      key: "products",
      header: "Products",
      align: "right",
      cell: (row) => <MiniBar value={row.productCount} max={maxProducts} tone="brand" />,
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      cell: (row) => <span className="font-semibold text-ink-900">{formatCompactPrice(row.revenue)}</span>,
    },
    {
      key: "storefront",
      header: "",
      align: "right",
      cell: (row) => (
        <Link
          href={`/products?brand=${row.slug}`}
          className="text-[0.78rem] font-semibold text-brand-700 hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Brands"
        description={`${brands.length} brands · ${formatNumber(brands.reduce((sum, brand) => sum + brand.productCount, 0))} active products`}
      />

      {blocked === "1" && (
        <div className="mb-4">
          <Alert tone="warning" title="Brand still has products">
            Reassign those products to another brand before deleting.
          </Alert>
        </div>
      )}
      {deleted === "1" && (
        <div className="mb-4">
          <Alert tone="success" title="Brand deleted">
            It no longer appears in storefront filters.
          </Alert>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AdminPanel title="All brands" description="Ordered by catalogue size" padded={false}>
          <div className="p-4 sm:p-5">
            <DataTable rows={brands} columns={columns} emptyMessage="No brands yet" caption="Brands" />
          </div>
        </AdminPanel>

        <AdminPanel
          title="Add or edit a brand"
          description="Brand logos live in /public/images/brands."
          action={
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Plus className="size-4" />
            </span>
          }
        >
          <BrandManager brands={brands.map(({ id, name, slug, logo, productCount }) => ({ id, name, slug, logo, productCount }))} />
        </AdminPanel>
      </div>
    </>
  );
}
