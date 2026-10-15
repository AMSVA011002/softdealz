import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock, ShoppingBag } from "lucide-react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Breadcrumbs } from "@/components/ui/nav";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getCart, calculateTotals, validateCoupon } from "@/lib/data/cart";
import { readAppliedCoupon } from "@/lib/coupon-session";
import { listAddresses } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your SoftDealz order.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const lines = getCart(user.id);
  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Nothing to check out yet"
          description="Add a few items to your cart and we'll get you through checkout in under a minute."
          action={<ButtonLink href="/products">Browse products</ButtonLink>}
        />
      </div>
    );
  }

  const appliedCoupon = await readAppliedCoupon();
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const coupon = appliedCoupon ? validateCoupon(appliedCoupon, subtotal) : null;
  const couponCode = coupon?.valid ? appliedCoupon : null;
  const totals = calculateTotals(lines, { couponCode });
  const addresses = listAddresses(user.id);

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
          />
        </div>
      </div>

      <div className="container-page py-6 lg:py-9">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-fluid-3xl font-extrabold">Checkout</h1>
          <p className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-ink-500">
            <Lock className="size-3.5 text-brand-600" /> 256-bit encrypted · we never store card details
          </p>
        </div>

        <CheckoutFlow
          user={{ name: user.name, email: user.email, phone: user.phone ?? "" }}
          addresses={addresses}
          lines={lines}
          totals={totals}
          appliedCoupon={couponCode}
        />
      </div>
    </div>
  );
}
