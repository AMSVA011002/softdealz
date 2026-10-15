import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  ChevronRight,
  Minus,
  Package,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import {
  AddToCartPanel,
  DeliveryChecker,
  ProductGallery,
  ProductTrustStrip,
  RecentlyViewedTracker,
} from "@/components/product/product-bits";
import { ProductCard, ProductRail } from "@/components/product/product-card";
import { ReviewList, ReviewForm } from "@/components/product/reviews";
import { Breadcrumbs } from "@/components/ui/nav";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/feedback";
import { getProductBySlug, incrementProductViews, relatedProducts } from "@/lib/data/products";
import { ratingSummary, listProductReviews, hasReviewed } from "@/lib/data/reviews";
import { getCategoryBySlug, categoryBreadcrumbs } from "@/lib/data/categories";
import { getCurrentUser } from "@/lib/auth";
import { listWishlist } from "@/lib/data/account";
import { formatPrice, formatNumber, timeAgo } from "@/lib/format";
import { richTextPlainText, sanitizeRichTextHtml, storedTextToRichHtml } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.shortDescription ?? richTextPlainText(product.description).slice(0, 155),
    openGraph: {
      title: product.title,
      description: product.shortDescription ?? richTextPlainText(product.description).slice(0, 155),
      images: product.images.slice(0, 1),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || product.status === "ARCHIVED") notFound();
  const richTextSpec = product.specs.find(
    (spec): spec is { type: "richText"; html: string } =>
      "type" in spec && spec.type === "richText",
  );

  incrementProductViews(product.id);

  const user = await getCurrentUser();
  const reviews = listProductReviews(product.id, { limit: 12 });
  const summary = ratingSummary(product.id);
  const related = relatedProducts(product, 10);
  const category = getCategoryBySlug(product.categorySlug ?? "");
  const crumbs = product.categorySlug ? categoryBreadcrumbs(product.categorySlug) : [];
  const alreadyReviewed = user ? hasReviewed(user.id, product.id) : false;
  const purchasedBefore = user
    ? listWishlist(user.id).some((entry) => entry.productId === product.id)
    : false;

  const inStock = product.stock > 0;
  const savings = product.compareAtPrice ? product.compareAtPrice - product.price : 0;

  return (
    <div className="bg-white">
      <RecentlyViewedTracker productId={product.id} />

      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              ...crumbs.map((crumb, index) => ({
                label: crumb.name,
                href: index === crumbs.length - 1 ? undefined : `/category/${crumb.slug}`,
              })),
              { label: product.title },
            ]}
          />
        </div>
      </div>

      <div className="container-page py-6 lg:py-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* gallery */}
          <div className="lg:sticky lg:top-40 lg:self-start">
            <ProductGallery product={product} />
          </div>

          {/* buy box */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link
                  href={`/category/${category.slug}`}
                  className="text-[0.78rem] font-semibold uppercase tracking-wide text-brand-700 hover:text-brand-800"
                >
                  {category.name}
                </Link>
              )}
              {product.brandName && (
                <span className="text-[0.78rem] text-ink-400">· {product.brandName}</span>
              )}
              {product.isFeatured && <Badge tone="brand">Editor&apos;s pick</Badge>}
            </div>

            <h1 className="mt-2 text-fluid-3xl font-extrabold leading-tight">{product.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5" aria-hidden>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={
                        star <= Math.round(product.rating)
                          ? "size-4 fill-amber-400 text-amber-400"
                          : "size-4 text-ink-300"
                      }
                      strokeWidth={star <= Math.round(product.rating) ? 0 : 1.6}
                    />
                  ))}
                </span>
                <span className="text-[0.85rem] font-semibold text-ink-800">
                  {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                </span>
                <a href="#reviews" className="text-[0.82rem] text-ocean-600 hover:underline">
                  {product.reviewCount} reviews
                </a>
              </div>
              <span className="text-[0.82rem] text-ink-500">
                {formatNumber(product.soldCount)} sold
              </span>
              <span className="text-[0.82rem] text-ink-500">SKU {product.sku}</span>
            </div>

            {/* price */}
            <div className="mt-5 rounded-2xl border border-ink-200 bg-ink-50/70 p-4">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-fluid-3xl font-extrabold text-brand-700">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="text-fluid-lg text-ink-400 line-through">
                      {formatPrice(product.compareAtPrice, product.currency)}
                    </span>
                    <span className="rounded-full bg-rose-brand px-2.5 py-1 text-[0.72rem] font-extrabold text-white">
                      Save {formatPrice(savings, product.currency)}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem]">
                {inStock ? (
                  product.stock <= product.lowStockAlert ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                      <Package className="size-4" /> Only {product.stock} left in stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
                      <Package className="size-4" /> In stock — ready to ship
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-rose-brand">
                    <Minus className="size-4" /> Currently out of stock
                  </span>
                )}
                <span className="text-ink-500">
                  {product.freeShipping ? "Free delivery" : `Delivery ${formatPrice(product.shippingFee)}`}
                </span>
                <span className="text-ink-500">{product.condition === "NEW" ? "Brand new" : product.condition}</span>
              </div>

              {product.stock > 0 && product.stock < 25 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                      style={{ width: `${Math.max(10, Math.min(92, (product.stock / 25) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[0.74rem] text-ink-500">
                    Selling fast — {product.stock} of 25 units remaining this week
                  </p>
                </div>
              )}
            </div>

            {/* purchase */}
            <div className="mt-5">
              <AddToCartPanel product={product} />
            </div>

            <div className="mt-5">
              <ProductTrustStrip product={product} />
            </div>

            <div className="mt-4">
              <DeliveryChecker />
            </div>

            {/* highlights */}
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                { icon: Truck, label: "Ships in", value: product.freeShipping ? "1–2 working days" : "2–4 working days" },
                { icon: RotateCcw, label: "Returns", value: "7 day easy returns" },
                { icon: ShieldCheck, label: "Warranty", value: product.warranty ?? "Buyer protection" },
                { icon: Award, label: "Seller", value: product.brandName ? `${product.brandName} official` : "SoftDealz verified" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3.5 py-2.5">
                  <item.icon className="size-4 shrink-0 text-brand-600" aria-hidden />
                  <span className="text-[0.8rem] text-ink-500">
                    {item.label}: <span className="font-semibold text-ink-800">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>

            {product.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-[0.78rem] font-semibold text-ink-500">Tags:</span>
                {product.tags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-ink-100 px-2.5 py-1 text-[0.74rem] text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- description + specs + reviews ---------------- */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div className="min-w-0 space-y-10">
            <section id="description">
              <h2 className="mb-4 text-fluid-xl font-extrabold">Product description</h2>
              <div
                className="space-y-3.5 text-[0.9rem] leading-relaxed text-ink-600 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: storedTextToRichHtml(product.description) }}
              />
            </section>

            {product.specs.length > 0 && (
              <section id="specs">
                <h2 className="mb-4 text-fluid-xl font-extrabold">Specifications</h2>
                {richTextSpec ? (
                  <div
                    className="space-y-3.5 text-[0.9rem] leading-relaxed text-ink-700 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichTextHtml(richTextSpec.html),
                    }}
                  />
                ) : (
                  <dl className="overflow-hidden rounded-2xl border border-ink-200">
                    {product.specs.map((spec, index) => "label" in spec && (
                      <div
                        key={`${spec.label}-${index}`}
                        className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${
                          index % 2 === 0 ? "bg-white" : "bg-ink-50"
                        }`}
                      >
                        <dt className="w-full shrink-0 text-[0.8rem] font-semibold text-ink-500 sm:w-44">
                          {spec.label}
                        </dt>
                        <dd className="text-[0.86rem] text-ink-800">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            )}

            <section id="reviews">
              <h2 className="mb-4 text-fluid-xl font-extrabold">
                Customer reviews{" "}
                <span className="text-[0.9rem] font-normal text-ink-500">({summary.total})</span>
              </h2>

              <ReviewList
                reviews={reviews}
                summary={summary}
                productTitle={product.title}
              />

              {user ? (
                alreadyReviewed ? (
                  <p className="mt-6 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-[0.85rem] font-medium text-brand-800">
                    Thanks — you&apos;ve already reviewed this product.
                  </p>
                ) : (
                  <ReviewForm slug={product.slug} />
                )
              ) : (
                <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 px-4 py-4 text-[0.85rem] text-ink-600">
                  <Link href={`/login?next=/product/${product.slug}`} className="font-semibold text-brand-700 hover:underline">
                    Sign in
                  </Link>{" "}
                  to write a review. Verified purchases get a “Verified buyer” badge.
                </div>
              )}
            </section>
          </div>

          {/* sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-40 lg:self-start">
            <div className="card-surface p-4">
              <h3 className="mb-3 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
                Delivery & returns
              </h3>
              <ul className="space-y-3 text-[0.82rem] text-ink-600">
                <li className="flex gap-2.5">
                  <Truck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <span>
                    Island-wide courier in 2–4 working days. Cash on delivery available in all 25 districts.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <RotateCcw className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <span>7 day returns on unused items in original packaging.</span>
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <span>Every order is covered by SoftDealz buyer protection.</span>
                </li>
              </ul>
            </div>

            {purchasedBefore && (
              <div className="rounded-2xl border border-ocean-200 bg-ocean-50 p-4">
                <p className="text-[0.82rem] font-semibold text-ocean-800">On your wishlist</p>
                <p className="mt-0.5 text-[0.78rem] text-ocean-700">
                  View it any time from{" "}
                  <Link href="/account/wishlist" className="font-semibold underline">
                    your wishlist
                  </Link>
                  .
                </p>
              </div>
            )}

            {related.length > 0 && (
              <div className="card-surface p-4">
                <h3 className="mb-3 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
                  Similar products
                </h3>
                <ul className="space-y-3">
                  {related.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link href={`/product/${item.slug}`} className="group flex gap-3">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                          <Image
                            src={item.images[0] ?? "/images/products/placeholder.svg"}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2-safe text-[0.8rem] font-medium text-ink-800 group-hover:text-brand-700">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-[0.82rem] font-bold text-ink-900">
                            {formatPrice(item.price)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/category/${product.categorySlug}`}
                  className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-ink-200 py-2 text-[0.78rem] font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  See all in {product.categoryName} <ChevronRight className="size-3.5" />
                </Link>
              </div>
            )}

            <div className="card-surface p-4">
              <h3 className="mb-2 text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">
                Recently viewed
              </h3>
              <p className="text-[0.78rem] text-ink-500">
                Your browsing history is saved on this device. Last updated {timeAgo(new Date())}.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------------- related rail ---------------- */}
      <ProductRail
        products={related}
        eyebrow="You may also like"
        title={`More in ${product.categoryName ?? "this category"}`}
        href={`/category/${product.categorySlug}`}
      />

      <section className="container-page pb-12">
        <SectionHeading eyebrow="Keep exploring" title="Recommended for you" />
        <div className="grid-products">
          {related.slice(0, 5).map((item) => (
            <ProductCard key={`rec-${item.id}`} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
