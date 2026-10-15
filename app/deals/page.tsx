import type { Metadata } from "next";
import Image from "next/image";
import { Flame, Tag } from "lucide-react";
import { ProductBrowser } from "@/components/shop/product-browser";
import { Breadcrumbs } from "@/components/ui/nav";
import { DealCountdown } from "@/components/home/sections";
import { buildFacets } from "@/lib/data/facets";
import { searchProducts, dealProducts } from "@/lib/data/products";
import { activePromotions } from "@/lib/data/coupons";
import { pageHrefTemplate, parseProductFilters, type SearchParamsRecord } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Today's deals",
  description:
    "Every discounted product on SoftDealz in one place — flash sales, clearance and coupon-friendly offers updated daily.",
};

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const params = await searchParams;
  const parsedFilters = parseProductFilters(params);
  const flashDealsOnly = params.flash === "1";
  const filters = {
    ...parsedFilters,
    onSale: true,
    flashDealsOnly,
    sort: parsedFilters.sort,
  };
  const result = searchProducts(filters);
  const facets = buildFacets(filters);
  const spotlight = flashDealsOnly ? [] : dealProducts(3);
  const coupons = activePromotions(4);

  // eslint-disable-next-line react-hooks/purity -- Seed the client countdown from this request's time.
  const countdownNow = Date.now();
  const endsAt = new Date(countdownNow);
  endsAt.setHours(23, 59, 59, 0);

  const biggestSaving = result.items.reduce(
    (best, product) => Math.max(best, (product.compareAtPrice ?? 0) - product.price),
    0,
  );

  return (
    <div className="surface-brand min-h-screen">
      {/* header */}
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: flashDealsOnly ? "Flash deals" : "Deals" }]} />
        </div>
      </div>

      <div className="border-b border-ink-200 bg-gradient-to-r from-rose-50 via-white to-amber-50">
        <div className="container-page flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:py-8">
          <div className="flex items-center gap-3.5">
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-rose-brand text-white shadow-sm">
              <Flame className="size-6" />
            </span>
            <div>
              <h1 className="text-fluid-2xl font-extrabold">
                {flashDealsOnly ? "All flash deals" : "Today's deals"}
              </h1>
              <p className="mt-0.5 text-[0.85rem] text-ink-500">
                {result.total} {flashDealsOnly ? "flash deal products" : "discounted products"}
                {biggestSaving > 0 && ` · biggest saving ${formatPrice(biggestSaving)}`}
              </p>
            </div>
          </div>
          <DealCountdown endsAt={endsAt.toISOString()} initialNow={countdownNow} />
        </div>
      </div>

      {/* spotlight */}
      {spotlight.length > 0 && (
        <section className="container-page py-6 lg:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {spotlight.map((product) => (
              <a
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  <Image
                    src={product.images[0] ?? "/images/products/placeholder.svg"}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="absolute -mt-10 ml-14 rounded-full bg-rose-brand px-2 py-0.5 text-[0.66rem] font-extrabold text-white sm:ml-0 sm:mt-0 sm:static">
                    −{product.discountPercent}%
                  </span>
                  <span className="mt-1 block text-[0.85rem] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
                    {product.title}
                  </span>
                  <span className="mt-1 block text-fluid-lg font-extrabold text-brand-700">
                    {formatPrice(product.price)}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* coupons */}
      {coupons.length > 0 && (
        <section className="container-page pb-6">
          <div className="flex flex-wrap gap-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex min-w-[15rem] flex-1 items-center gap-3 rounded-xl border border-dashed border-brand-300 bg-white p-3.5"
              >
                <Tag className="size-5 shrink-0 text-brand-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[0.95rem] font-extrabold tracking-wide text-brand-700">
                    {coupon.code}
                  </p>
                  <p className="truncate text-[0.75rem] text-ink-500">{coupon.description}</p>
                </div>
                {coupon.minSpend > 0 && (
                  <span className="shrink-0 text-[0.7rem] font-semibold text-ink-500">
                    Min {formatPrice(coupon.minSpend)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductBrowser
        result={result}
        facets={facets}
        pageHrefTemplate={pageHrefTemplate("/deals", params)}
        description="All prices already reduced"
      />
    </div>
  );
}
