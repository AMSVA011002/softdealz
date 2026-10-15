import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ProductBrowser } from "@/components/shop/product-browser";
import { Breadcrumbs } from "@/components/ui/nav";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { buildFacets } from "@/lib/data/facets";
import { searchProducts, trendingProducts } from "@/lib/data/products";
import { logSearch } from "@/lib/data/analytics";
import { pageHrefTemplate, parseProductFilters, type SearchParamsRecord } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  return {
    title: query ? `Search: ${query}` : "Search",
    description: `Search results for ${query || "products"} on SoftDealz.`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const query = filters.q ?? "";

  // Feed the admin dashboard's "top searches" widget.
  if (query) logSearch(query);

  const result = searchProducts(filters);
  const facets = buildFacets(filters);
  const suggestions = result.total === 0 ? trendingProducts(8) : [];

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: query ? `Search “${query}”` : "Search" }]}
          />
        </div>
      </div>

      {result.total === 0 ? (
        <div className="container-page py-10 lg:py-16">
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={query ? `No results for “${query}”` : "What are you looking for?"}
            description="Check the spelling, use fewer words, or try one of the popular searches below."
            action={
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <ButtonLink href="/products">Browse all products</ButtonLink>
                <ButtonLink href="/deals" variant="outline">
                  Today&apos;s deals
                </ButtonLink>
              </div>
            }
          />

          {suggestions.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 text-fluid-xl font-bold">You might like these instead</h2>
              <div className="grid-products">
                {suggestions.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <ProductBrowser
          result={result}
          facets={facets}
          pageHrefTemplate={pageHrefTemplate("/search", params)}
          title={query ? `Results for “${query}”` : "Search results"}
        />
      )}
    </div>
  );
}
