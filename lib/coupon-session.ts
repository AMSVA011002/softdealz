import "server-only";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";

/**
 * The coupon a shopper has applied to their cart.
 *
 * Coupons are kept in an httpOnly cookie rather than client state so the cart
 * page, the checkout summary and the order-writing server action all agree on
 * the same code. Previously the discount only existed in the browser, so the
 * order was written at full price.
 */
const COOKIE_NAME = "softdealz_coupon";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const CODE_PATTERN = /^[A-Z0-9-]{3,40}$/;

export function normaliseCouponCode(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** The currently applied coupon code, or null. */
export async function readAppliedCoupon(): Promise<string | null> {
  const store = await cookies();
  return normaliseCouponCode(store.get(COOKIE_NAME)?.value);
}

/** Remember the code for this browser (called after a successful validation). */
export async function writeAppliedCoupon(code: string): Promise<void> {
  const normalised = normaliseCouponCode(code);
  if (!normalised) return;

  const store = await cookies();
  store.set(COOKIE_NAME, normalised, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAppliedCoupon(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
