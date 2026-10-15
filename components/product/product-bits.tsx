"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Heart, Loader2, Minus, Plus, ShoppingCart, Truck, Undo2, ShieldCheck } from "lucide-react";
import { useShop } from "@/components/providers/shop-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Add to cart block (PDP + quick buy)                                 */
/* ------------------------------------------------------------------ */

export function AddToCartPanel({ product, className }: { product: Product; className?: string }) {
  const { addToCart, toggleWishlist, wishlistIds, pendingProductId } = useShop();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const busy = pendingProductId === product.id;
  const wishlisted = wishlistIds.includes(product.id);
  const inStock = product.stock > 0;
  const max = Math.min(10, product.stock);

  const handleAdd = async () => {
    const success = await addToCart(product.id, quantity, product.title);
    if (success) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2200);
    }
  };

  return (
    <div className={cn("space-y-3.5", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl border border-ink-300 bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="grid size-11 place-items-center rounded-l-xl text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-11 text-center text-[0.9rem] font-bold text-ink-900" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={quantity >= max}
            className="grid size-11 place-items-center rounded-r-xl text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button
          onClick={handleAdd}
          disabled={!inStock}
          loading={busy && !added}
          size="lg"
          className="min-w-[11rem] flex-1 sm:flex-none"
        >
          {added ? (
            <>
              <Check className="size-4" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              {inStock ? "Add to cart" : "Out of stock"}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          onClick={() => toggleWishlist(product.id, product.title)}
          disabled={busy}
          className={cn("shrink-0", wishlisted && "border-rose-brand text-rose-brand")}
        >
          <Heart className={cn("size-5", wishlisted && "fill-current")} />
        </Button>
      </div>

      {inStock ? (
        <ButtonLink href="/checkout" variant="ocean" size="lg" fullWidth onClick={() => addToCart(product.id, quantity, product.title)}>
          Buy it now
        </ButtonLink>
      ) : (
        <Button variant="subtle" size="lg" fullWidth disabled>
          Notify me when back in stock
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product gallery                                                     */
/* ------------------------------------------------------------------ */

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const images = product.images.length > 0 ? product.images : ["/images/products/placeholder.svg"];
  const discount = product.discountPercent ?? 0;

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="relative flex-1">
        <div
          className={cn(
            "group relative aspect-square w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-100",
            zoom && "cursor-zoom-out",
          )}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
        >
          <Image
            src={images[active]}
            alt={product.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 46vw"
            className={cn(
              "object-cover transition-transform duration-500",
              zoom ? "scale-[1.35]" : "scale-100",
            )}
            unoptimized
          />

          {discount > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-rose-brand px-3 py-1 text-[0.78rem] font-extrabold text-white shadow-sm">
              −{discount}% off
            </span>
          )}
          {product.condition !== "NEW" && (
            <span className="absolute right-4 top-4 rounded-full bg-ink-900/85 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-wide text-white backdrop-blur">
              {product.condition}
            </span>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={active === index}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-xl border-2 bg-ink-100 transition-all sm:size-20",
                active === index ? "border-brand-600 ring-2 ring-brand-600/20" : "border-ink-200 hover:border-ink-300",
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */

export function ProductTrustStrip({ product }: { product: Product }) {
  const items = [
    {
      icon: Truck,
      title: product.freeShipping ? "Free delivery" : `Delivery ${formatPrice(product.shippingFee, product.currency)}`,
      body: "2–4 working days island-wide",
    },
    { icon: Undo2, title: "7 day returns", body: "Unused items, no questions" },
    {
      icon: ShieldCheck,
      title: product.warranty ?? "Buyer protection",
      body: "Covered by SoftDealz guarantee",
    },
  ];

  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-white p-3">
          <item.icon className="mt-0.5 size-4.5 shrink-0 text-brand-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-[0.8rem] font-semibold leading-tight text-ink-900">{item.title}</p>
            <p className="text-[0.72rem] leading-snug text-ink-500">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery checker                                                    */
/* ------------------------------------------------------------------ */

export function DeliveryChecker() {
  const [postal, setPostal] = React.useState("");
  const [result, setResult] = React.useState<{ days: string; fee: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const check = (event: React.FormEvent) => {
    event.preventDefault();
    if (postal.trim().length < 4) return;
    setLoading(true);
    // Deterministic mock: real builds would call a courier rate API here.
    window.setTimeout(() => {
      const numeric = Number.parseInt(postal.replace(/\D/g, "").slice(0, 5) || "100", 10);
      setResult({
        days: numeric % 3 === 0 ? "2–3 working days" : numeric % 2 === 0 ? "3–4 working days" : "4–5 working days",
        fee: numeric % 3 === 0 ? "Free" : "LKR 450",
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5">
      <p className="mb-2.5 text-[0.8rem] font-semibold text-ink-900">Check delivery to your area</p>
      <form onSubmit={check} className="flex gap-2">
        <input
          value={postal}
          onChange={(event) => setPostal(event.target.value)}
          inputMode="numeric"
          placeholder="Postal code e.g. 11500"
          aria-label="Postal code"
          className="h-10 min-w-0 flex-1 rounded-lg border border-ink-300 bg-white px-3 text-[0.84rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
        />
        <Button type="submit" size="sm" variant="ocean" loading={loading} className="shrink-0">
          Check
        </Button>
      </form>
      {result && (
        <p className="mt-2.5 animate-[fade-in_0.2s_ease-out] text-[0.8rem] text-ink-700">
          Estimated delivery{" "}
          <span className="font-semibold text-brand-700">{result.days}</span> · Courier{" "}
          <span className="font-semibold">{result.fee}</span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact quantity + buy used inside lists                            */
/* ------------------------------------------------------------------ */

export function QuickBuyButton({ product, label = "Add to cart" }: { product: Product; label?: string }) {
  const { addToCart, pendingProductId } = useShop();
  const busy = pendingProductId === product.id;

  return (
    <Button
      size="sm"
      onClick={() => addToCart(product.id, 1, product.title)}
      disabled={busy || product.stock <= 0}
      className="shrink-0"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ShoppingCart className="size-3.5" />}
      <span className="hidden sm:inline">{product.stock > 0 ? label : "Sold out"}</span>
    </Button>
  );
}

/** Small "recently viewed" rail that persists in localStorage. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("softdealz:viewed");
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [productId, ...list.filter((id) => id !== productId)].slice(0, 12);
      window.localStorage.setItem("softdealz:viewed", JSON.stringify(next));
    } catch {
      /* storage unavailable — non-critical */
    }
  }, [productId]);
  return null;
}
