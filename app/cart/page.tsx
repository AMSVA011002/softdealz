import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { CartTable } from "@/components/cart/cart-table";
import { CartSummary } from "@/components/cart/cart-summary";
import { Breadcrumbs } from "@/components/ui/nav";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getCart, calculateTotals, validateCoupon } from "@/lib/data/cart";
import { readAppliedCoupon } from "@/lib/coupon-session";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your SoftDealz cart before checking out.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cart");

  const lines = getCart(user.id);
  // Coupons live in an httpOnly cookie so the cart, checkout and order agree.
  const appliedCoupon = await readAppliedCoupon();
  const coupon = appliedCoupon ? validateCoupon(appliedCoupon, lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)) : null;
  const couponCode = coupon?.valid ? appliedCoupon : null;
  const totals = calculateTotals(lines, { couponCode });

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        </div>
      </div>

      <div className="container-page py-7 lg:py-10">
        <h1 className="text-fluid-3xl font-extrabold">
          Your cart{" "}
          {totals.itemCount > 0 && (
            <span className="text-fluid-lg font-semibold text-ink-500">
              ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"})
            </span>
          )}
        </h1>

        {lines.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<ShoppingBag className="size-6" />}
              title="Your cart is empty"
              description="Browse today's deals or explore a category to find something you'll love."
              action={
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <ButtonLink href="/products">Start shopping</ButtonLink>
                  <ButtonLink href="/deals" variant="outline">
                    See today&apos;s deals
                  </ButtonLink>
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <CartTable lines={lines} />
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href="/products" variant="outline" size="sm">
                  Continue shopping
                </ButtonLink>
                <p className="text-[0.8rem] text-ink-500">
                  Prices and stock are confirmed again at checkout.
                </p>
              </div>
            </div>

            <div className="lg:sticky lg:top-40 lg:self-start">
              <CartSummary totals={totals} showCoupon appliedCoupon={couponCode} />
              <div className="mt-4 rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-[0.8rem] font-semibold text-ink-900">Need help?</p>
                <p className="mt-1 text-[0.78rem] text-ink-500">
                  Call <Link href="tel:+94112345678" className="text-brand-700 hover:underline">+94 11 234 5678</Link>{" "}
                  or read our{" "}
                  <Link href="/help" className="text-brand-700 hover:underline">
                    shipping guide
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
