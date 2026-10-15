"use client";

import * as React from "react";
import { BadgePercent, Check, Loader2, Lock, Truck, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useShop } from "@/components/providers/shop-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartTotals } from "@/lib/types";

export function CartSummary({
  totals,
  showCoupon = false,
  checkoutHref = "/checkout",
  showCheckout = true,
  compact = false,
  appliedCoupon = null,
}: {
  totals: CartTotals;
  showCoupon?: boolean;
  checkoutHref?: string;
  showCheckout?: boolean;
  compact?: boolean;
  /** Coupon already applied to this cart (kept server-side in a cookie). */
  appliedCoupon?: string | null;
}) {
  const toast = useToast();
  const { refresh } = useShop();
  const [code, setCode] = React.useState("");
  const [applied, setApplied] = React.useState<string | null>(appliedCoupon);
  const [loading, setLoading] = React.useState(false);
  const [localTotals, setLocalTotals] = React.useState(totals);

  React.useEffect(() => setLocalTotals(totals), [totals]);
  React.useEffect(() => setApplied(appliedCoupon), [appliedCoupon]);

  const applyCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        code?: string;
        totals?: CartTotals;
      };

      if (!data.ok || !data.totals) {
        toast.error("Coupon not applied", data.error);
        return;
      }

      setApplied(data.code ?? code.trim().toUpperCase());
      setLocalTotals(data.totals);
      toast.success("Coupon applied", data.message);
      refresh();
    } catch {
      toast.error("Network error", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    setApplied(null);
    setCode("");
    setLocalTotals(totals);
    try {
      // Clearing the cookie keeps the checkout page and the order in sync.
      await fetch("/api/coupon", { method: "DELETE" });
      toast.info("Coupon removed");
      refresh();
    } catch {
      toast.error("Network error", "Please try again.");
    }
  };

  return (
    <div className={cn("card-surface p-4", !compact && "sm:p-5")}>
      <h2 className="text-fluid-lg font-bold">Order summary</h2>

      {showCoupon && (
        <div className="mt-4">
          {applied ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-[0.82rem] font-semibold text-brand-800">
                <BadgePercent className="size-4" />
                {applied}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                aria-label="Remove coupon"
                className="grid size-7 place-items-center rounded-md text-brand-700 transition-colors hover:bg-brand-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={applyCoupon} className="flex gap-2">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Coupon code"
                aria-label="Coupon code"
                sizeVariant="sm"
                className="min-w-0 flex-1"
              />
              <Button type="submit" size="sm" variant="outline" loading={loading} className="shrink-0">
                Apply
              </Button>
            </form>
          )}
          <p className="mt-2 text-[0.72rem] text-ink-500">
            Try <span className="font-mono font-semibold">WELCOME10</span> or{" "}
            <span className="font-mono font-semibold">FREESHIP</span>
          </p>
        </div>
      )}

      <dl className="mt-5 space-y-2.5 text-[0.86rem]">
        <div className="flex items-center justify-between">
          <dt className="text-ink-600">Subtotal ({localTotals.itemCount} items)</dt>
          <dd className="font-semibold text-ink-900">{formatPrice(localTotals.subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5 text-ink-600">
            <Truck className="size-3.5 text-ink-400" /> Delivery
          </dt>
          <dd className={cn("font-semibold", localTotals.shippingFee === 0 ? "text-brand-700" : "text-ink-900")}>
            {localTotals.shippingFee === 0 ? "Free" : formatPrice(localTotals.shippingFee)}
          </dd>
        </div>

        {localTotals.discount > 0 && (
          <div className="flex items-center justify-between text-brand-700">
            <dt className="flex items-center gap-1.5">
              <BadgePercent className="size-3.5" /> Discount
            </dt>
            <dd className="font-semibold">−{formatPrice(localTotals.discount)}</dd>
          </div>
        )}

        {localTotals.tax > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-ink-600">Tax</dt>
            <dd className="font-semibold text-ink-900">{formatPrice(localTotals.tax)}</dd>
          </div>
        )}

        <div className="flex items-baseline justify-between border-t border-ink-200 pt-3">
          <dt className="text-[0.95rem] font-bold text-ink-900">Total</dt>
          <dd className="text-fluid-2xl font-extrabold text-brand-700">{formatPrice(localTotals.total)}</dd>
        </div>
      </dl>

      {localTotals.freeShippingRemaining > 0 && localTotals.subtotal > 0 && (
        <div className="mt-4 rounded-xl bg-ocean-50 px-3.5 py-2.5">
          <p className="text-[0.78rem] font-medium text-ocean-800">
            Add {formatPrice(localTotals.freeShippingRemaining)} more to unlock free delivery.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ocean-100">
            <div
              className="h-full rounded-full bg-ocean-600 transition-all duration-500"
              style={{ width: `${Math.min(100, (localTotals.subtotal / 25000) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="mt-5 space-y-3">
          {localTotals.itemCount === 0 ? (
            <Button size="lg" fullWidth disabled>
              <Lock className="size-4" />
              Proceed to checkout
            </Button>
          ) : (
            <ButtonLink href={checkoutHref} size="lg" fullWidth>
              <Lock className="size-4" />
              Proceed to checkout
            </ButtonLink>
          )}
          <div className="flex items-center justify-center gap-4 text-[0.72rem] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5 text-brand-600" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5 text-brand-600" /> 7 day returns
            </span>
          </div>
        </div>
      )}

      {loading && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-ink-500">
          <Loader2 className="size-3.5 animate-spin" /> Checking coupon…
        </p>
      )}
    </div>
  );
}
