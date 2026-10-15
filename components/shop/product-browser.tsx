import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import {
  ActiveFilterChips,
  FilterSidebar,
  MobileFilterButton,
  SortSelect,
  type FilterFacets,
} from "@/components/shop/filters";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/nav";
import { formatNumber } from "@/lib/format";
import type { Paginated, Product } from "@/lib/types";

/**
 * Shared results view for /products, /category/[slug], /search and /deals.
 * Layout: sticky filter rail on desktop, bottom-sheet filters on mobile,
 * and a two-up grid on phones through to six-up on 4K displays.
 */
export function ProductBrowser({
  result,
  facets,
  lockedCategory = false,
  pageHrefTemplate,
  title,
  description,
}: {
  result: Paginated<Product>;
  /** Server-computed filter options. `total` is filled from the result set. */
  facets: Omit<FilterFacets, "total">;
  lockedCategory?: boolean;
  /** `/products?sort=newest&page={page}` */
  pageHrefTemplate: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="container-page py-6 lg:py-9">
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <FilterSidebar facets={{ ...facets, total: result.total }} lockedCategory={lockedCategory} />

        <div className="min-w-0">
          {/* toolbar */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                {title && <h1 className="truncate text-fluid-xl font-extrabold">{title}</h1>}
                <p className="text-[0.82rem] text-ink-500">
                  <span className="font-semibold text-ink-800">{formatNumber(result.total)}</span> products
                  {description ? ` · ${description}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <MobileFilterButton facets={{ ...facets, total: result.total }} lockedCategory={lockedCategory} />
                <SortSelect />
              </div>
            </div>

            <ActiveFilterChips />
          </div>

          {/* results */}
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-6" />}
              title="No products match those filters"
              description="Try removing a filter, widening the price range, or searching for something else."
              action={
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <ButtonLink href="/products" variant="primary">
                    Browse everything
                  </ButtonLink>
                  <ButtonLink href="/deals" variant="outline">
                    See today&apos;s deals
                  </ButtonLink>
                </div>
              }
            />
          ) : (
            <>
              <div className="grid-products">
                {result.items.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                hrefTemplate={pageHrefTemplate}
                className="mt-9"
              />

              <p className="mt-4 text-center text-[0.78rem] text-ink-500">
                Showing {(result.page - 1) * result.perPage + 1}–
                {Math.min(result.page * result.perPage, result.total)} of {formatNumber(result.total)} products ·{" "}
                <Link href="/help#delivery" className="text-brand-700 hover:underline">
                  Delivery info
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
