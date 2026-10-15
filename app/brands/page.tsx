import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/nav";
import { all } from "@/lib/db";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shop by brand",
  description:
    "Browse every brand on SoftDealz — from Voltix electronics to Ceylon Harvest groceries. Official stock, warranty and fast island-wide delivery.",
  alternates: { canonical: "/brands" },
};

export const revalidate = 300;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function BrandsPage() {
  const brands = all(
    `SELECT b.id, b.name, b.slug, b.logo,
            (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE') AS product_count,
            COALESCE((SELECT MIN(p.price) FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE'), 0) AS min_price
       FROM brands b
      ORDER BY b.name ASC`,
  ).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logo: (row.logo as string | null) ?? null,
    productCount: Number(row.product_count ?? 0),
    minPrice: Number(row.min_price ?? 0),
  }));

  const grouped = brands.reduce<Record<string, typeof brands>>((acc, brand) => {
    const letter = brand.name.charAt(0).toUpperCase();
    acc[letter] = acc[letter] ?? [];
    acc[letter].push(brand);
    return acc;
  }, {});

  const featured = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 8);

  return (
    <>
      <section className="surface-brand border-b border-ink-200">
        <div className="container-page py-8 lg:py-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-fluid-4xl font-extrabold">Shop by brand</h1>
              <p className="mt-2 max-w-2xl text-fluid-base text-ink-600">
                {brands.length} brands,{" "}
                {formatNumber(brands.reduce((sum, brand) => sum + brand.productCount, 0))} products — all sourced
                through official channels with local warranty support.
              </p>
            </div>
            <ButtonLink href="/products" variant="outline">
              Browse everything
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* letter nav */}
      <div className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur lg:top-[var(--header-offset,0)]">
        <div className="container-page">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-3">
            {LETTERS.map((letter) => {
              const active = Boolean(grouped[letter]);
              return active ? (
                <a
                  key={letter}
                  href={`#brand-${letter}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[0.8rem] font-bold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[0.8rem] font-bold text-ink-200"
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-page py-8 lg:py-10">
        {/* featured brands */}
        <section>
          <h2 className="flex items-center gap-2 text-fluid-2xl font-extrabold">
            <Store className="size-5 text-brand-600" /> Featured brands
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                className="group card-surface flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink-200 bg-white">
                  {brand.logo ? (
                    <Image src={brand.logo} alt="" fill sizes="56px" className="object-contain p-1.5" unoptimized />
                  ) : (
                    <span className="text-[1.1rem] font-extrabold text-ink-300">{brand.name.charAt(0)}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.88rem] font-bold text-ink-900 group-hover:text-brand-700">
                    {brand.name}
                  </span>
                  <span className="mt-0.5 block text-[0.76rem] text-ink-500">
                    {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
                  </span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>

        {/* full A–Z */}
        <section className="mt-10">
          <h2 className="text-fluid-2xl font-extrabold">All brands A–Z</h2>
          <p className="mt-1.5 text-[0.88rem] text-ink-500">Jump to a letter to find a specific maker.</p>

          <div className="mt-5 space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, group]) => (
                <div key={letter} id={`brand-${letter}`} className="scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-[0.9rem] font-extrabold text-white">
                      {letter}
                    </span>
                    <span className="h-px flex-1 bg-ink-200" />
                    <span className="text-[0.75rem] text-ink-400">{group.length} brands</span>
                  </div>

                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.map((brand) => (
                      <li key={brand.id}>
                        <Link
                          href={`/products?brand=${brand.slug}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-colors hover:border-brand-400 hover:bg-brand-50/40"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[0.84rem] font-semibold text-ink-800">
                              {brand.name}
                            </span>
                            <span className="block text-[0.72rem] text-ink-500">
                              {brand.productCount} item{brand.productCount === 1 ? "" : "s"}
                            </span>
                          </span>
                          {brand.minPrice > 0 && (
                            <Badge tone="neutral" size="sm">
                              from {Math.round(brand.minPrice).toLocaleString("en-LK")}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="surface-brand rounded-3xl p-6 text-center sm:p-10">
            <h2 className="text-fluid-3xl font-extrabold">Can&apos;t find a brand you love?</h2>
            <p className="mx-auto mt-2 max-w-xl text-[0.9rem] text-ink-600">
              Tell us what you&apos;re looking for and our sourcing team will try to bring it in — often within a week.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact">Request a brand</ButtonLink>
              <ButtonLink href="/products" variant="outline">
                Keep browsing
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
