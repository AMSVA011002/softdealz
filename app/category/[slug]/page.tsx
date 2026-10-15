import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/shop/product-browser";
import { Breadcrumbs } from "@/components/ui/nav";
import { buildFacets } from "@/lib/data/facets";
import { searchProducts } from "@/lib/data/products";
import { categoryBreadcrumbs, getCategoryBySlug, getCategoryTree } from "@/lib/data/categories";
import { pageHrefTemplate, parseProductFilters, type SearchParamsRecord } from "@/lib/queries";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name} on SoftDealz — verified sellers, island-wide delivery and 7 day returns.`,
    openGraph: {
      title: `${category.name} · SoftDealz`,
      images: category.image ? [category.image] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  const { slug } = await params;
  const rawParams = await searchParams;

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  // Category in the path always wins over the ?category= filter.
  const filters = { ...parseProductFilters(rawParams), category: slug };
  const result = searchProducts(filters);
  const facets = buildFacets({ category: slug });
  const crumbs = categoryBreadcrumbs(slug);

  const subcategories = (getCategoryTree().find((entry) => entry.id === category.id)?.children ?? []).filter(
    (child) => (child.productCount ?? 0) > 0,
  );

  return (
    <div className="surface-brand min-h-screen">
      {/* hero */}
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-4 lg:py-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              ...crumbs.map((crumb, index) => ({
                label: crumb.name,
                href: index === crumbs.length - 1 ? undefined : `/category/${crumb.slug}`,
              })),
            ]}
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 sm:size-20">
              <Image
                src={category.image ?? "/images/products/placeholder.svg"}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </span>
            <div className="min-w-0">
              <h1 className="text-fluid-2xl font-extrabold">{category.name}</h1>
              <p className="mt-1 text-[0.85rem] text-ink-500">
                {category.description ?? `Browse ${category.name.toLowerCase()} on SoftDealz`} ·{" "}
                <span className="font-semibold text-ink-700">{formatNumber(result.total)} products</span>
              </p>
            </div>
          </div>

          {subcategories.length > 0 && (
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {subcategories.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                >
                  {child.name}
                  <span className="ml-1.5 text-[0.72rem] text-ink-400">{child.productCount}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductBrowser
        result={result}
        facets={facets}
        lockedCategory
        pageHrefTemplate={pageHrefTemplate(`/category/${slug}`, rawParams)}
        description={category.description ?? undefined}
      />
    </div>
  );
}
