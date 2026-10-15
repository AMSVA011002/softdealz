"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { useShop } from "@/components/providers/shop-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

type Variant = "grid" | "compact" | "list" | "wide";

/**
 * The workhorse of the storefront. Four layouts so the same product data works
 * in a dense 4K grid, a carousel, a mobile two-up grid and a search list.
 */
export function ProductCard({
  product,
  variant = "grid",
  priority = false,
  className,
  showQuickAdd = true,
}: {
  product: Product;
  variant?: Variant;
  priority?: boolean;
  className?: string;
  showQuickAdd?: boolean;
}) {
  const { addToCart, toggleWishlist, wishlistIds, pendingProductId } = useShop();
  const [imageIndex, setImageIndex] = React.useState(0);

  const wishlisted = wishlistIds.includes(product.id);
  const busy = pendingProductId === product.id;
  const image = product.images[imageIndex] ?? product.images[0] ?? "/images/products/placeholder.svg";
  const inStock = product.stock > 0;
  const discount = product.discountPercent ?? 0;
  const isLowStock = inStock && product.stock <= product.lowStockAlert;

  const handleAdd = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await addToCart(product.id, 1, product.title);
  };

  const handleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await toggleWishlist(product.id, product.title);
  };

  const media = (
    <div
      className={cn(
        "relative overflow-hidden bg-ink-100",
        variant === "list" || variant === "wide" ? "aspect-square w-32 shrink-0 rounded-xl sm:w-40" : "aspect-[4/3] w-full",
      )}
      onMouseEnter={() => product.images[1] && setImageIndex(1)}
      onMouseLeave={() => setImageIndex(0)}
    >
      <Image
        src={image}
        alt={product.title}
        fill
        sizes={
          variant === "grid"
            ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1920px) 20vw, 16vw"
            : "200px"
        }
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn(
          "object-cover transition-transform duration-500",
          inStock ? "group-hover:scale-[1.06]" : "opacity-70 grayscale-[35%]",
        )}
        unoptimized
      />

      {/* badges */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
        {discount > 0 && (
          <span className="rounded-full bg-rose-brand px-2 py-0.5 text-[0.66rem] font-extrabold text-white shadow-sm">
            −{discount}%
          </span>
        )}
        {product.isFeatured && discount === 0 && (
          <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-wide text-white shadow-sm">
            Featured
          </span>
        )}
        {!inStock && (
          <span className="rounded-full bg-ink-900/85 px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-wide text-white backdrop-blur">
            Sold out
          </span>
        )}
        {isLowStock && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[0.66rem] font-bold text-white shadow-sm">
            {product.stock} left
          </span>
        )}
      </div>

      {/* wishlist */}
      <button
        type="button"
        onClick={handleWishlist}
        disabled={busy}
        aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
        className={cn(
          // `z-20` keeps the heart above the card-wide link overlay below — without it,
          // a tap on the heart fell through to the product link instead of saving.
          "absolute right-2.5 top-2.5 z-20 grid size-9 place-items-center rounded-full bg-white/92 text-ink-500 shadow-soft backdrop-blur transition-all hover:scale-105 hover:text-rose-brand disabled:opacity-60",
          wishlisted && "text-rose-brand",
        )}
      >
        <Heart className={cn("size-4", wishlisted && "fill-current")} />
      </button>

      {/* quick add — pointer devices only, keeps mobile taps clean */}
      {showQuickAdd && inStock && variant === "grid" && (
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 hidden translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-[0.82rem] font-semibold text-white shadow-brand transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <ShoppingCart className="size-4" />
            {busy ? "Adding…" : "Add to cart"}
          </button>
        </div>
      )}
    </div>
  );

  const body = (
    <div className={cn("flex min-w-0 flex-1 flex-col", variant === "grid" || variant === "compact" ? "p-3 sm:p-3.5" : "")}>
      {product.categoryName && (
        <p className="mb-1 truncate text-[0.68rem] font-semibold uppercase tracking-wide text-ink-400">
          {product.brandName ? `${product.brandName} · ` : ""}
          {product.categoryName}
        </p>
      )}

      <h3
        className={cn(
          "line-clamp-2-safe font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-700",
          variant === "compact" ? "text-[0.82rem]" : "text-[0.88rem]",
        )}
      >
        <Link href={`/product/${product.slug}`} className="focus:outline-none">
          {/* Stretched link: makes the whole card (picture included) clickable at every
              breakpoint. Controls above it opt out with `z-20`. */}
          <span className="absolute inset-0 z-10" aria-hidden />
          {product.title}
        </Link>
      </h3>

      {variant === "list" && product.shortDescription && (
        <p className="mt-1 line-clamp-2-safe text-[0.8rem] text-ink-500">{product.shortDescription}</p>
      )}

      <div className="mt-1.5 flex items-center gap-1.5">
        <RatingStars rating={product.rating} />
        <span className="text-[0.72rem] text-ink-400">
          {product.rating > 0 ? product.rating.toFixed(1) : "New"}
          {product.reviewCount > 0 && ` (${product.reviewCount})`}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "font-extrabold text-ink-900",
            variant === "compact" ? "text-[0.95rem]" : "text-fluid-lg",
          )}
        >
          {formatPrice(product.price, product.currency)}
        </span>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="text-[0.76rem] text-ink-400 line-through">
            {formatPrice(product.compareAtPrice, product.currency)}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-ink-500">
        {product.freeShipping ? (
          <span className="font-semibold text-brand-700">Free delivery</span>
        ) : (
          <span>Delivery {formatPrice(product.shippingFee, product.currency)}</span>
        )}
        {product.soldCount > 30 && <span>{product.soldCount}+ sold</span>}
      </div>

      {(variant === "list" || variant === "wide") && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !inStock}
            className="relative z-20 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-[0.82rem] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-55"
          >
            <ShoppingCart className="size-4" />
            {inStock ? (busy ? "Adding…" : "Add to cart") : "Out of stock"}
          </button>
          <Link
            href={`/product/${product.slug}`}
            className="relative z-20 inline-flex h-10 items-center gap-2 rounded-xl border border-ink-300 px-4 text-[0.82rem] font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
          >
            <Eye className="size-4" /> Details
          </Link>
        </div>
      )}
    </div>
  );

  if (variant === "list" || variant === "wide") {
    return (
      <article
        className={cn(
          "group card-surface relative flex gap-3.5 overflow-hidden p-3 transition-shadow hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-500/60 sm:gap-4 sm:p-4",
          className,
        )}
      >
        {media}
        {body}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group card-surface relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-500/60",
        className,
      )}
    >
      {media}
      {body}
    </article>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="relative inline-flex">
          <Star className="size-3.5 text-ink-300" strokeWidth={1.6} />
          {rounded >= star && (
            <Star className="absolute inset-0 size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
          )}
          {rounded === star - 0.5 && (
            <span className="absolute inset-0 w-1/2 overflow-hidden">
              <Star className="size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

/** Horizontally scrolling product rail — used for deals, new arrivals and related items. */
export function ProductRail({
  products,
  title,
  eyebrow,
  href,
  linkLabel = "View all",
}: {
  products: Product[];
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="container-page py-8 lg:py-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-600">
              {eyebrow}
            </p>
          )}
          <h2 className="text-fluid-2xl font-extrabold">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded-xl border border-ink-300 px-3.5 py-2 text-[0.8rem] font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
          >
            {linkLabel}
          </Link>
        )}
      </div>

      <div className="scroll-row product-rail-row no-scrollbar -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="product-rail-card">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
