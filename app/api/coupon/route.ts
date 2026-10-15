import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { calculateTotals, getCart, validateCoupon } from "@/lib/data/cart";
import { fail, ok, readJson } from "@/lib/api";
import { RATE_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { formatPrice } from "@/lib/format";
import { defaultCurrency } from "@/lib/env";
import { clearAppliedCoupon, writeAppliedCoupon } from "@/lib/coupon-session";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code").max(40),
});

/** Applies a coupon to the signed-in shopper's cart and returns fresh totals. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to use a coupon", 401);

  const limit = rateLimit(
    `coupon:${clientIp(request)}`,
    RATE_LIMITS.coupon.limit,
    RATE_LIMITS.coupon.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return fail(`Too many attempts. Try again in ${limit.retryAfterSeconds}s.`, 429);
  }

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Enter a coupon code");

  const lines = getCart(user.id);
  if (lines.length === 0) return fail("Your cart is empty");

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const result = validateCoupon(parsed.data.code, subtotal);
  if (!result.valid) return fail(result.error ?? "That coupon is not valid");

  // Persist the code so the cart page, checkout and the order action all use
  // the same discount (the browser alone used to hold the state, which meant
  // coupon codes never reached the order).
  await writeAppliedCoupon(parsed.data.code);

  const totals = calculateTotals(lines, { couponCode: parsed.data.code });
  const currency = lines[0]?.product.currency ?? defaultCurrency();

  return ok({
    coupon: result.coupon,
    code: result.coupon?.code ?? parsed.data.code.toUpperCase(),
    totals,
    message: result.freeShipping
      ? "Free shipping applied"
      : `Coupon applied — you saved ${formatPrice(result.discount, currency)}`,
  });
}

/** Removes the coupon currently applied to this browser. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to manage coupons", 401);

  await clearAppliedCoupon();
  const lines = getCart(user.id);

  return ok({ totals: calculateTotals(lines) });
}
