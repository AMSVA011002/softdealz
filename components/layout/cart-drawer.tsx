"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/overlay";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useShop } from "@/components/providers/shop-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ApiCartItem {
  id: string;
  productId: string;
  quantity: number;
  lineTotal: number;
  product: { id: string; title: string; slug: string; price: number; images: string[]; stock: number };
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cartCount, isAuthenticated, setQuantity, removeItem, pendingProductId } = useShop();
  const [items, setItems] = React.useState<ApiCartItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items?: ApiCartItem[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (cartOpen) void load();
  }, [cartOpen, load, cartCount]);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const freeShippingRemaining = Math.max(0, 25000 - subtotal);

  return (
    <Drawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={`Your cart${cartCount > 0 ? ` (${cartCount})` : ""}`}
      width="max-w-lg"
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.85rem] text-ink-600">Subtotal</span>
              <span className="text-fluid-lg font-extrabold text-ink-900">{formatPrice(subtotal)}</span>
            </div>
            {freeShippingRemaining > 0 ? (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-[0.78rem] font-medium text-brand-700">
                Add {formatPrice(freeShippingRemaining)} more for free shipping
              </p>
            ) : (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-[0.78rem] font-medium text-brand-700">
                🎉 You have unlocked free shipping
              </p>
            )}
            <div className="flex flex-col gap-2.5">
              <ButtonLink href="/checkout" size="lg" fullWidth onClick={() => setCartOpen(false)}>
                Checkout · {formatPrice(subtotal)}
              </ButtonLink>
              <ButtonLink href="/cart" variant="outline" fullWidth onClick={() => setCartOpen(false)}>
                View full cart
              </ButtonLink>
            </div>
          </div>
        ) : null
      }
    >
      {!isAuthenticated ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Sign in to start shopping"
          description="Your cart is saved to your account so you can pick up where you left off on any device."
          action={
            <ButtonLink href="/login?next=/cart" onClick={() => setCartOpen(false)}>
              Sign in
            </ButtonLink>
          }
          compact
        />
      ) : loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[0.85rem] text-ink-500">
          <Loader2 className="size-4 animate-spin" /> Loading your cart…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Your cart is empty"
          description="Browse today's deals and add something you love."
          action={
            <ButtonLink href="/products" onClick={() => setCartOpen(false)}>
              Start shopping
            </ButtonLink>
          }
          compact
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const busy = pendingProductId === item.productId;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 rounded-xl border border-ink-200 p-3 transition-opacity",
                  busy && "opacity-60",
                )}
              >
                <Link
                  href={`/product/${item.product.slug}`}
                  onClick={() => setCartOpen(false)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink-100"
                >
                  <Image
                    src={item.product.images[0] ?? "/images/products/placeholder.svg"}
                    alt={item.product.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/product/${item.product.slug}`}
                    onClick={() => setCartOpen(false)}
                    className="line-clamp-2-safe text-[0.85rem] font-medium leading-snug text-ink-900 hover:text-brand-700"
                  >
                    {item.product.title}
                  </Link>
                  <p className="mt-1 text-[0.82rem] font-bold text-ink-900">{formatPrice(item.product.price)}</p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="inline-flex items-center rounded-lg border border-ink-300">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        className="grid size-8 place-items-center rounded-l-lg text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-[0.82rem] font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={busy || item.quantity >= item.product.stock}
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        className="grid size-8 place-items-center rounded-r-lg text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-ink-400 transition-colors hover:text-rose-brand"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
