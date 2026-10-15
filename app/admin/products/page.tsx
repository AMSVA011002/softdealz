import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Star, Trash2, Zap } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, type Column } from "@/components/admin/kit";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/nav";
import { adminListProducts } from "@/lib/data/products";
import { listCategoriesFlat } from "@/lib/data/categories";
import { intParam } from "@/lib/params";
import { deleteProductAction, toggleProductFieldAction } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_TABS = ["ALL", "ACTIVE", "DRAFT", "ARCHIVED"];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; flashDeals?: string; flashDealError?: string; sort?: string; page?: string; saved?: string; deleted?: string; delete?: string }>;
}) {
  const params = await searchParams;
  const page = intParam(params.page, 1, { min: 1, max: 10_000 });
  const status = params.status ?? "ALL";
  const categoryId = params.category ?? "ALL";

  const result = adminListProducts({
    q: params.q,
    status,
    categoryId,
    flashDealsOnly: params.flashDeals === "1",
    page,
    perPage: 20,
    sort: params.sort,
  });

  const categories = listCategoriesFlat();

  const query = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    Object.entries({ ...params, ...overrides }).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "saved" && key !== "deleted" && key !== "delete") {
        next.set(key, String(value));
      }
    });
    const search = next.toString();
    return `/admin/products${search ? `?${search}&page={page}` : "?page={page}"}`;
  };

  const columns: Array<Column<Product>> = [
    {
      key: "product",
      header: "Product",
      cell: (row) => (
        <span className="flex items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
            <Image
              src={row.images[0] ?? "/images/products/placeholder.svg"}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              unoptimized
            />
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/products/${row.id}`}
              className="line-clamp-2-safe block text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
            >
              {row.title}
            </Link>
            <span className="mt-0.5 block font-mono text-[0.72rem] text-ink-500">{row.sku}</span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={row.status} />
          {row.isFeatured && (
            <Badge tone="amber" size="sm">
              <Star className="size-3 fill-current" /> Featured
            </Badge>
          )}
          {row.isFlashDeal && (
            <Badge tone="rose" size="sm">
              <Zap className="size-3 fill-current" /> Flash deal
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "lg",
      cell: (row) => <span className="text-[0.8rem] text-ink-600">{row.categoryName ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (row) => (
        <span className="block">
          <span className="block font-semibold text-ink-900">{formatPrice(row.price)}</span>
          {row.compareAtPrice && row.compareAtPrice > row.price && (
            <span className="block text-[0.72rem] text-ink-400 line-through">{formatPrice(row.compareAtPrice)}</span>
          )}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (row) => (
        <span
          className={
            row.stock === 0
              ? "font-bold text-rose-brand"
              : row.stock <= row.lowStockAlert
                ? "font-bold text-amber-600"
                : "text-ink-700"
          }
        >
          {row.stock}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <span className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/products/${row.id}`}
            className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            aria-label={`Edit ${row.title}`}
          >
            <Pencil className="size-3.5" />
          </Link>
          <form action={toggleProductFieldAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="field" value="is_featured" />
            <button
              type="submit"
              aria-label={row.isFeatured ? `Unfeature ${row.title}` : `Feature ${row.title}`}
              className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                row.isFeatured
                  ? "border-amber-300 bg-amber-50 text-amber-600"
                  : "border-ink-200 text-ink-500 hover:border-amber-300 hover:text-amber-600"
              }`}
            >
              <Star className={`size-3.5 ${row.isFeatured ? "fill-current" : ""}`} />
            </button>
          </form>
          <form action={toggleProductFieldAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="field" value="is_flash_deal" />
            <button
              type="submit"
              aria-label={row.isFlashDeal ? `Remove ${row.title} from flash deals` : `Add ${row.title} to flash deals`}
              title={row.isFlashDeal ? "Remove from flash deals" : "Add to flash deals"}
              className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                row.isFlashDeal
                  ? "border-rose-300 bg-rose-50 text-rose-brand"
                  : "border-ink-200 text-ink-500 hover:border-rose-300 hover:text-rose-brand"
              }`}
            >
              <Zap className={`size-3.5 ${row.isFlashDeal ? "fill-current" : ""}`} />
            </button>
          </form>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={row.id} />
            <button
              type="submit"
              aria-label={`Delete ${row.title}`}
              className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-brand"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${result.total} product${result.total === 1 ? "" : "s"} in the catalogue`}
        action={
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus className="size-4" /> New product
          </ButtonLink>
        }
      />

      {params.saved === "1" && (
        <div className="mb-4">
          <Alert tone="success" title="Product saved">
            The catalogue and storefront are up to date.
          </Alert>
        </div>
      )}
      {params.deleted === "1" && (
        <div className="mb-4">
          <Alert tone="info" title="Product deleted">
            It has been removed from the catalogue.
          </Alert>
        </div>
      )}
      {params.flashDealError && (
        <div className="mb-4">
          <Alert tone="danger" title="Could not add flash deal">
            {params.flashDealError}
          </Alert>
        </div>
      )}

      <AdminPanel padded={false}>
        <div className="space-y-4 border-b border-ink-200 p-4 sm:p-5">
          <form className="flex flex-wrap items-center gap-2.5" action="/admin/products" method="get">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by title or SKU…"
              aria-label="Search products"
              className="h-10 min-w-[12rem] flex-1 rounded-xl border border-ink-300 bg-white px-3.5 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:max-w-sm"
            />
            <select
              name="category"
              defaultValue={categoryId}
              aria-label="Filter by category"
              className="h-10 rounded-xl border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none"
            >
              <option value="ALL">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
            <select
              name="flashDeals"
              defaultValue={params.flashDeals === "1" ? "1" : "ALL"}
              aria-label="Filter by flash deal status"
              className="h-10 rounded-xl border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none"
            >
              <option value="ALL">All deal status</option>
              <option value="1">Flash deals only</option>
            </select>
            <select
              name="sort"
              defaultValue={params.sort ?? "updated"}
              aria-label="Sort products"
              className="h-10 rounded-xl border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none"
            >
              <option value="updated">Recently updated</option>
              <option value="price">Price: high to low</option>
              <option value="stock">Stock: low to high</option>
            </select>
            {status !== "ALL" && <input type="hidden" name="status" value={status} />}
            <Button type="submit" size="sm">
              Apply
            </Button>
            {(params.q || categoryId !== "ALL" || params.flashDeals || params.sort || status !== "ALL") && (
              <ButtonLink href="/admin/products" variant="ghost" size="sm">
                Reset
              </ButtonLink>
            )}
          </form>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const active = tab === status;
              const href = `/admin/products${(() => {
                const next = new URLSearchParams();
                if (params.q) next.set("q", params.q);
                if (categoryId !== "ALL") next.set("category", categoryId);
                if (params.flashDeals === "1") next.set("flashDeals", "1");
                if (params.sort) next.set("sort", params.sort);
                if (tab !== "ALL") next.set("status", tab);
                const search = next.toString();
                return search ? `?${search}` : "";
              })()}`;
              return (
                <Link
                  key={tab}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <DataTable rows={result.items} columns={columns} emptyMessage="No products match those filters" caption="Products" />
        </div>

        {result.totalPages > 1 && (
          <div className="border-t border-ink-200 px-4 py-4 sm:px-5">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              hrefTemplate={query({})}
              className="justify-center"
            />
          </div>
        )}
      </AdminPanel>

      <p className="mt-4 flex items-center gap-1.5 text-[0.76rem] text-ink-400">
        <CheckCircle2 className="size-3.5" /> Tip: use the star button to feature a product on the homepage.
        <AlertTriangle className="size-3.5" /> Deleting cannot be undone.
      </p>
    </>
  );
}
