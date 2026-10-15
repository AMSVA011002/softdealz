import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { listWishlist } from "@/lib/data/account";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "My wishlist",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const entries = listWishlist(user.id);
  const totalValue = entries.reduce((sum, entry) => sum + entry.product.price, 0);
  const inStock = entries.filter((entry) => entry.product.stock > 0).length;
  const onSale = entries.filter((entry) => (entry.product.discountPercent ?? 0) > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-fluid-2xl font-extrabold">My wishlist</h1>
          <p className="mt-0.5 text-[0.85rem] text-ink-500">
            {entries.length} saved item{entries.length === 1 ? "" : "s"}
            {onSale > 0 && ` · ${onSale} on sale right now`}
          </p>
        </div>
        {entries.length > 0 && (
          <div className="text-right">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-400">Total value</p>
            <p className="text-fluid-lg font-extrabold text-ink-900">{formatPrice(totalValue)}</p>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-6" />}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here — we'll tell you when the price drops."
          action={<ButtonLink href="/products">Find something you love</ButtonLink>}
        />
      ) : (
        <>
          {inStock < entries.length && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.82rem] text-amber-800">
              {entries.length - inStock} item{entries.length - inStock === 1 ? " is" : "s are"} currently out of stock.
              We&apos;ll keep them here until they return.
            </p>
          )}

          <div className="grid-products">
            {entries.map((entry) => (
              <ProductCard key={entry.id} product={entry.product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
