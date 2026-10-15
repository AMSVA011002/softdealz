"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useShop } from "@/components/providers/shop-provider";
import { QuantityStepper } from "@/components/ui/field";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

export function CartTable({ lines }: { lines: CartLine[] }) {
  const { setQuantity, removeItem, toggleWishlist, pendingProductId } = useShop();

  return (
    <ul className="card-surface divide-y divide-ink-200 overflow-hidden">
      {lines.map((line) => {
        const busy = pendingProductId === line.productId;
        const lowStock = line.product.stock <= line.product.lowStockAlert;

        return (
          <li key={line.id} className={cn("p-4 transition-opacity sm:p-5", busy && "opacity-60")}>
            <div className="flex gap-4">
              <Link
                href={`/product/${line.product.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:size-28"
              >
                <Image
                  src={line.product.images[0] ?? "/images/products/placeholder.svg"}
                  alt={line.product.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {line.product.categoryName && (
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-400">
                        {line.product.categoryName}
                      </p>
                    )}
                    <h2 className="mt-0.5 line-clamp-2-safe text-[0.9rem] font-semibold leading-snug text-ink-900">
                      <Link href={`/product/${line.product.slug}`} className="hover:text-brand-700">
                        {line.product.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-[0.75rem] text-ink-500">SKU {line.product.sku}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[0.95rem] font-extrabold text-ink-900">{formatPrice(line.lineTotal)}</p>
                    {line.quantity > 1 && (
                      <p className="text-[0.74rem] text-ink-500">
                        {formatPrice(line.product.price)} each
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => setQuantity(line.productId, next)}
                    max={Math.max(1, Math.min(10, line.product.stock))}
                    disabled={busy}
                    size="sm"
                  />

                  <button
                    type="button"
                    onClick={() => toggleWishlist(line.productId, line.product.title)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-500 transition-colors hover:text-ocean-600"
                  >
                    <Heart className="size-3.5" /> Save for later
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-500 transition-colors hover:text-rose-brand"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>

                {lowStock && (
                  <p className="mt-2.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.75rem] font-medium text-amber-800">
                    Only {line.product.stock} left — order soon to secure yours
                  </p>
                )}
                {line.product.freeShipping && (
                  <p className="mt-2 text-[0.75rem] font-semibold text-brand-700">Free delivery on this item</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
