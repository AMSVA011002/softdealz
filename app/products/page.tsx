import type { Metadata } from "next";
import { ProductBrowser } from "@/components/shop/product-browser";
import { Breadcrumbs } from "@/components/ui/nav";
import { buildFacets } from "@/lib/data/facets";
import { searchProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { pageHrefTemplate, parseProductFilters, type SearchParamsRecord } from "@/lib/queries";

export const metadata: Metadata = {
  title: "All products",
  description:
    "Browse every product on SoftDealz — electronics, fashion, home, grocery, toys and more, with filters for price, brand, rating and delivery.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const result = searchProducts(filters);
  const facets = buildFacets(filters);

  // Quick-jump department strip makes the global listing navigable on mobile.
  const departments = listCategories()
    .filter((category) => !category.parentId && category.isActive)
    .slice(0, 10);

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All products" }]} />
        </div>
      </div>

      <div className="border-b border-ink-200 bg-white">
        <div className="container-page no-scrollbar flex gap-2 overflow-x-auto py-3">
          {departments.map((department) => (
            <a
              key={department.id}
              href={`/category/${department.slug}`}
              className="shrink-0 rounded-full border border-ink-200 px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
            >
              {department.name}
            </a>
          ))}
        </div>
      </div>

      <ProductBrowser
        result={result}
        facets={facets}
        pageHrefTemplate={pageHrefTemplate("/products", params)}
        title="All products"
        description="Free shipping over LKR 25,000"
      />
    </div>
  );
}
