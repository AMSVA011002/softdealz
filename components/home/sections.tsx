"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  Clock,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";
import { resolveImageUrl } from "@/lib/image-url";

/* ------------------------------------------------------------------ */
/* Category tiles                                                      */
/* ------------------------------------------------------------------ */

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 3xl:grid-cols-8">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
        >
          <span className="relative block aspect-[4/3] w-full overflow-hidden bg-ink-100">
            <Image
              src={category.image ? resolveImageUrl(category.image) : "/images/products/placeholder.svg"}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          </span>
          <span className="flex flex-1 flex-col p-3">
            <span className="text-[0.85rem] font-semibold leading-tight text-ink-900 group-hover:text-brand-700">
              {category.name}
            </span>
            <span className="mt-0.5 text-[0.72rem] text-ink-500">
              {category.productCount ?? 0} products
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deal countdown                                                      */
/* ------------------------------------------------------------------ */

function useCountdown(target: Date, initialNow: number) {
  const [remaining, setRemaining] = React.useState(() => target.getTime() - initialNow);

  React.useEffect(() => {
    setRemaining(target.getTime() - Date.now());
    const timer = window.setInterval(() => setRemaining(target.getTime() - Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const clamped = Math.max(0, remaining);
  return {
    hours: Math.floor(clamped / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
  };
}

export function DealCountdown({ endsAt, initialNow }: { endsAt: string; initialNow: number }) {
  // Date is created once per mount so the interval target stays stable.
  const target = React.useMemo(() => new Date(endsAt), [endsAt]);
  const { hours, minutes, seconds } = useCountdown(target, initialNow);

  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="flex items-center gap-2" role="timer" aria-live="off">
      <Clock className="size-4 text-rose-brand" aria-hidden />
      <span className="text-[0.78rem] font-semibold text-ink-600">Ends in</span>
      <div className="flex items-center gap-1">
        {[pad(hours), pad(minutes), pad(seconds)].map((value, index) => (
          <React.Fragment key={index}>
            <span className="grid h-7 min-w-7 place-items-center rounded-md bg-ink-900 px-1.5 text-[0.78rem] font-bold tabular-nums text-white">
              {value}
            </span>
            {index < 2 && <span className="text-[0.78rem] font-bold text-ink-400">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deal spotlight                                                      */
/* ------------------------------------------------------------------ */

export function DealBanner({
  products,
  endsAt,
  initialNow,
}: {
  products: Product[];
  endsAt: string;
  initialNow: number;
}) {
  if (products.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-ink-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-rose-brand text-white shadow-sm">
            <BadgePercent className="size-5" />
          </span>
          <div>
            <h3 className="text-fluid-lg font-extrabold text-ink-900">Flash deals</h3>
            <p className="text-[0.78rem] text-ink-500">Limited stock at these prices</p>
          </div>
        </div>
        <DealCountdown endsAt={endsAt} initialNow={initialNow} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-ink-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex gap-3 p-4 transition-colors hover:bg-ink-50 sm:border-r sm:border-ink-200 sm:last:border-r-0"
          >
            <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
              <Image
                src={product.images[0] ?? "/images/products/placeholder.svg"}
                alt=""
                fill
                sizes="80px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="line-clamp-2-safe text-[0.82rem] font-medium leading-snug text-ink-900">
                {product.title}
              </span>
              <span className="mt-auto flex items-baseline gap-2 pt-1.5">
                <span className="text-[0.95rem] font-extrabold text-brand-700">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-[0.72rem] text-ink-400 line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                )}
              </span>
              <span className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-ocean-500"
                  style={{ width: `${Math.max(12, Math.min(94, (product.soldCount % 90) + 8))}%` }}
                />
              </span>
            </span>
          </Link>
        ))}
      </div>
      {products.length > 4 && (
        <div className="flex justify-center border-t border-ink-200 p-3.5 sm:justify-end sm:px-5">
          <Link
            href="/deals?flash=1"
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.84rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
          >
            More flash deals
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Value props                                                         */
/* ------------------------------------------------------------------ */

const VALUE_PROPS = [
  { icon: Truck, title: "Free shipping over LKR 25,000", body: "Island-wide in 2–4 working days" },
  { icon: ShieldCheck, title: "Secure, buyer-protected", body: "Every order is covered end to end" },
  { icon: Banknote, title: "Pay your way", body: "Card, wallet or cash on delivery" },
  { icon: Headphones, title: "Real human support", body: "Mon–Sat, 8:30am–8:00pm" },
];

export function ValueProps() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {VALUE_PROPS.map((prop) => (
        <div
          key={prop.title}
          className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 transition-shadow hover:shadow-soft"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <prop.icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.85rem] font-semibold leading-snug text-ink-900">{prop.title}</p>
            <p className="mt-0.5 text-[0.76rem] leading-snug text-ink-500">{prop.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brand strip                                                         */
/* ------------------------------------------------------------------ */

export function BrandStrip({ brands }: { brands: Array<{ id: string; name: string; slug: string; logo: string | null }> }) {
  if (brands.length === 0) return null;

  const brandCards = (copy: "primary" | "duplicate") =>
    brands.map((brand) => (
      <Link
        key={`${copy}-${brand.id}`}
        href={`/search?q=${encodeURIComponent(brand.name)}`}
        tabIndex={copy === "duplicate" ? -1 : undefined}
        aria-hidden={copy === "duplicate" || undefined}
        className="group flex h-[4.5rem] w-36 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white p-3 transition-colors hover:border-brand-300 sm:w-40"
      >
        {brand.logo ? (
          <Image
            src={resolveImageUrl(brand.logo)}
            alt={copy === "primary" ? brand.name : ""}
            width={110}
            height={44}
            className="h-8 w-auto object-contain opacity-75 transition-opacity group-hover:opacity-100 sm:h-9"
            unoptimized
          />
        ) : (
          <span className="truncate text-[0.82rem] font-bold text-ink-600 group-hover:text-brand-700">
            {brand.name}
          </span>
        )}
      </Link>
    ));

  return (
    <div
      className="brand-marquee no-scrollbar overflow-x-auto rounded-2xl focus-within:overflow-x-auto"
      role="region"
      aria-label="Trusted brands"
      tabIndex={0}
    >
      <div
        className="brand-marquee-track flex w-max"
        style={{ animationDuration: `${Math.max(32, (brands.length / 12) * 32)}s` }}
      >
        <div className="flex shrink-0 gap-3 pr-3">{brandCards("primary")}</div>
        <div className="flex shrink-0 gap-3 pr-3" aria-hidden="true">
          {brandCards("duplicate")}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Promo banners                                                       */
/* ------------------------------------------------------------------ */

export function PromoBanners() {
  const promos = [
    {
      href: "/category/audio-headphones",
      eyebrow: "Sound upgrade",
      title: "Headphones & speakers",
      copy: "Up to 40% off top audio brands",
      className: "from-ocean-700 to-ocean-500",
      image: "/images/categories/audio-headphones.svg",
    },
    {
      href: "/category/home-kitchen",
      eyebrow: "Home refresh",
      title: "Kitchen essentials",
      copy: "Cookware from LKR 3,450",
      className: "from-brand-700 to-brand-500",
      image: "/images/categories/home-kitchen.svg",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {promos.map((promo) => (
        <Link
          key={promo.href}
          href={promo.href}
          className={cn(
            "group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br p-5 transition-transform hover:-translate-y-0.5 lg:p-7",
            promo.className,
          )}
        >
          <div className="relative z-10">
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-white/70">{promo.eyebrow}</p>
            <h3 className="mt-1 text-fluid-xl font-extrabold text-white">{promo.title}</h3>
            <p className="mt-1 text-[0.84rem] text-white/85">{promo.copy}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-white">
              Shop now
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl opacity-90 sm:size-28 lg:size-32">
            <Image src={promo.image} alt="" fill sizes="128px" className="object-cover" unoptimized />
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

const REVIEWS = [
  {
    name: "Sanduni F.",
    city: "Kandy",
    rating: 5,
    body: "Ordered a laptop on Tuesday and it arrived Thursday morning, properly packaged. The price was lower than the shops in town.",
  },
  {
    name: "Kasun J.",
    city: "Negombo",
    rating: 5,
    body: "The flash deals are genuinely good. I've bought kitchen appliances twice now and both times the quality matched the photos.",
  },
  {
    name: "Ishara G.",
    city: "Galle",
    rating: 4,
    body: "Returns were painless when a shirt didn't fit. Refund landed in four days through the wallet option.",
  },
  {
    name: "Tharindu S.",
    city: "Colombo",
    rating: 5,
    body: "Cash on delivery plus live tracking makes it easy to buy without worrying. Support answered my question on a Sunday.",
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {REVIEWS.map((review) => (
        <figure key={review.name} className="card-surface flex flex-col p-5">
          <div className="mb-3 flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Sparkles
                key={index}
                className={cn("size-3.5", index < review.rating ? "text-amber-400" : "text-ink-200")}
              />
            ))}
          </div>
          <blockquote className="flex-1 text-[0.85rem] leading-relaxed text-ink-600">“{review.body}”</blockquote>
          <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-100 pt-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-[0.75rem] font-bold text-white">
              {review.name.slice(0, 1)}
            </span>
            <span>
              <span className="block text-[0.82rem] font-semibold text-ink-900">{review.name}</span>
              <span className="block text-[0.72rem] text-ink-500">{review.city}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recently viewed (client, localStorage backed)                       */
/* ------------------------------------------------------------------ */

export function RecentlyViewed() {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    let ids: string[];
    try {
      const raw = window.localStorage.getItem("softdealz:viewed");
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      ids = Array.isArray(parsed)
        ? [...new Set(parsed.filter((id): id is string => typeof id === "string" && /^[\w-]{1,128}$/.test(id)))].slice(0, 8)
        : [];
    } catch (error) {
      console.error("Unable to read recently viewed products from browser storage", error);
      ids = [];
    }

    if (ids.length === 0) {
      setProducts([]);
      return () => controller.abort();
    }

    fetch(`/api/products/recently-viewed?ids=${encodeURIComponent(ids.join(","))}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Recently viewed lookup failed (${response.status})`);
        const result = (await response.json()) as { ok?: boolean; products?: Product[] };
        if (!result.ok || !Array.isArray(result.products)) {
          throw new Error("Recently viewed lookup returned an invalid response");
        }
        setProducts(result.products);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load recently viewed products", error);
      });

    return () => controller.abort();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="container-page py-8 lg:py-12">
      <h2 className="mb-5 text-fluid-2xl font-extrabold">Recently viewed</h2>
      <div className="scroll-row product-rail-row no-scrollbar -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="product-rail-card group rounded-2xl border border-ink-200 bg-white p-2.5 transition-shadow hover:shadow-lift"
          >
            <span className="relative block aspect-square overflow-hidden rounded-xl bg-ink-100">
              <Image
                src={product.images[0] ?? "/images/products/placeholder.svg"}
                alt=""
                fill
                sizes="176px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            </span>
            <span className="mt-2 line-clamp-2-safe text-[0.8rem] font-medium text-ink-800">{product.title}</span>
            <span className="mt-1 block text-[0.85rem] font-bold text-brand-700">
              {formatPrice(product.price, product.currency)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
