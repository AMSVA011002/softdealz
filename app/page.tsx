import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import {
  BrandStrip,
  CategoryTiles,
  DealBanner,
  PromoBanners,
  RecentlyViewed,
  Testimonials,
  ValueProps,
} from "@/components/home/sections";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/feedback";
import { featuredCategories, getCategoryTree } from "@/lib/data/categories";
import {
  bestSellersInCategory,
  dealProducts,
  featuredProducts,
  newArrivals,
  trendingProducts,
} from "@/lib/data/products";
import { activePromotions } from "@/lib/data/coupons";
import { all } from "@/lib/db";
import { allSettings } from "@/lib/data/account";
import { readHeroSlides } from "@/lib/home/hero-slides";
import { formatPrice } from "@/lib/format";

export const revalidate = 120;

export default async function HomePage() {
  const categories = featuredCategories(16);
  const tree = getCategoryTree();
  const featured = featuredProducts(10);
  const deals = dealProducts(5);
  const trending = trendingProducts(10);
  const fresh = newArrivals(10);
  const promotions = activePromotions(3);
  const topDepartments = tree
    .filter((category) => (category.productCount ?? 0) > 0 && !category.parentId)
    .slice(0, 2);

  const brands = all(
    `SELECT b.id, b.name, b.slug, b.logo FROM brands b
      ORDER BY (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) DESC, b.name COLLATE NOCASE`,
  ).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logo: row.logo ? String(row.logo) : null,
  }));
  const heroSlides = readHeroSlides(allSettings().hero_slides);

  // Flash deal window: next midnight, formatted for the countdown component.
  // eslint-disable-next-line react-hooks/purity -- Seed the client countdown from this request's time.
  const dealCountdownNow = Date.now();
  const dealEndsAt = new Date(dealCountdownNow);
  dealEndsAt.setHours(23, 59, 59, 0);

  return (
    <>
      <Hero slides={heroSlides} />

      {/* ---------------- categories ---------------- */}
      <section className="container-page py-10 lg:py-14">
        <SectionHeading
          eyebrow="Shop by category"
          title="Everything, neatly organised"
          description="Twenty top-level departments with hundreds of subcategories — from 4K TVs to Ceylon tea."
          action={
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-brand-700 hover:text-brand-800"
            >
              All categories
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <CategoryTiles categories={categories} />
      </section>

      {/* ---------------- value props ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <ValueProps />
      </section>

      {/* ---------------- flash deals ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <DealBanner
          products={deals}
          endsAt={dealEndsAt.toISOString()}
          initialNow={dealCountdownNow}
        />
      </section>

      {/* ---------------- featured grid ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <SectionHeading
          eyebrow="Editor's picks"
          title="Featured this week"
          description="Hand-selected products our team tested, rated and negotiated better prices on."
          action={
            <ButtonLink href="/products?sort=popular" variant="outline" size="sm">
              View all products
            </ButtonLink>
          }
        />
        <div className="grid-products">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 5} />
          ))}
        </div>
      </section>

      {/* ---------------- promos ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <PromoBanners />
      </section>

      {/* ---------------- trending grid ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <SectionHeading
          eyebrow="Most popular"
          title="Trending right now"
          action={
            <ButtonLink href="/products?sort=popular" variant="outline" size="sm">
              View all products
            </ButtonLink>
          }
        />
        <div className="grid-products">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ---------------- coupon strip ---------------- */}
      {promotions.length > 0 && (
        <section className="container-page py-8 lg:py-10">
          <div className="overflow-hidden rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-700">
                  Coupons you can use today
                </p>
                <h2 className="mt-1.5 text-fluid-xl font-extrabold text-ink-900">
                  Save more at checkout with these codes
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {promotions.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex min-w-[13rem] flex-1 items-center gap-3 rounded-xl border border-brand-200 bg-white p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.72rem] text-ink-500">{coupon.description}</p>
                      <p className="mt-0.5 font-mono text-[0.95rem] font-extrabold tracking-wide text-brand-700">
                        {coupon.code}
                      </p>
                      {coupon.minSpend > 0 && (
                        <p className="text-[0.68rem] text-ink-400">
                          Min. spend {formatPrice(coupon.minSpend)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-[0.7rem] font-bold text-white">
                      {coupon.type === "PERCENT"
                        ? `${coupon.value}% off`
                        : coupon.type === "FIXED"
                          ? `${formatPrice(coupon.value)} off`
                          : "Free ship"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- new arrivals grid ---------------- */}
      <section className="container-page pb-10 lg:pb-14">
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          action={
            <ButtonLink href="/products?sort=newest" variant="outline" size="sm">
              View all products
            </ButtonLink>
          }
        />
        <div className="grid-products">
          {fresh.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ---------------- best sellers by department ---------------- */}
      <section className="container-page py-10 lg:py-14">
        <SectionHeading
          eyebrow="Top departments"
          title="Best sellers by department"
          description="What shoppers across the island are buying most this month."
        />
        <div className="space-y-8">
          {topDepartments.map((department) => {
            const items = bestSellersInCategory(department.slug, 5);
            if (items.length === 0) return null;

            return (
              <div key={department.id}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-fluid-xl font-bold">{department.name}</h3>
                    <p className="text-[0.8rem] text-ink-500">
                      {department.productCount ?? 0} products available
                    </p>
                  </div>
                  <Link
                    href={`/category/${department.slug}`}
                    className="shrink-0 text-[0.83rem] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Shop all →
                  </Link>
                </div>
                <div className="grid-products">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- brands ---------------- */}
      <section className="container-page py-10 lg:py-14">
        <SectionHeading
          eyebrow="Trusted brands"
          title="Shop the brands you know"
          description="Official stock, local warranty and prices we negotiate on your behalf."
        />
        <BrandStrip brands={brands} />
      </section>

      {/* ---------------- testimonials ---------------- */}
      <section className="container-page py-10 lg:py-14">
        <SectionHeading
          eyebrow="Customer stories"
          title="48,000 shoppers can't be wrong"
          description="Real reviews from verified SoftDealz orders across all nine provinces."
          align="center"
        />
        <Testimonials />
      </section>

      <RecentlyViewed />

      {/* ---------------- closing CTA ---------------- */}
      <section className="container-page pb-12 lg:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-ocean-600 px-6 py-12 text-center lg:px-16 lg:py-16">
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/70">
              Ready when you are
            </p>
            <h2 className="mt-3 text-fluid-3xl font-extrabold text-white">
              Create your free SoftDealz account
            </h2>
            <p className="mt-3 text-fluid-base text-white/85">
              Track orders in real time, save items to a wishlist and get LKR 500 off your first order over LKR 5,000
              with code <span className="font-mono font-bold text-white">WELCOME10</span>.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" variant="white" size="lg">
                Create free account
              </ButtonLink>
              <ButtonLink
                href="/products"
                size="lg"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Keep browsing
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
