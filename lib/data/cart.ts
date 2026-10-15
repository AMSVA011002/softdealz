import { all, get, newId, run, scalar } from "@/lib/db";
import { mapProduct } from "@/lib/data/mappers";
import { round2, safeInt } from "@/lib/numbers";
import type { CartLine, CartTotals, Coupon, Product } from "@/lib/types";

export const FREE_SHIPPING_THRESHOLD = 25_000; // LKR
export const STANDARD_SHIPPING_FEE = 450; // LKR
export const TAX_RATE = 0; // prices are tax-inclusive in this build

/** Per-line ceiling, so a single order can never be a stock-hoarding accident. */
export const MAX_LINE_QUANTITY = 20;

export interface CartMutationResult {
  ok: boolean;
  /** Cart line id (add) or rows touched. */
  id?: string;
  quantity?: number;
  error?: string;
}

export function getCart(userId: string): CartLine[] {
  const rows = all(
    `SELECT ci.id AS cart_id, ci.quantity,
            p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC`,
    [userId],
  );

  return rows.map((row) => {
    const product = mapProduct(row) as Product;
    const quantity = Number(row.quantity ?? 1);
    return {
      id: String(row.cart_id),
      productId: product.id,
      quantity,
      product,
      lineTotal: product.price * quantity,
    };
  });
}

export function getCartCount(userId: string): number {
  return (
    scalar<number>("SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE user_id = ?", [
      userId,
    ]) ?? 0
  );
}

/**
 * Adds a product to the cart, refusing anything that cannot actually be
 * fulfilled. Quantity is clamped to `[1, MAX_LINE_QUANTITY]` and to the stock
 * on hand — previously a crafted request could park 20 units of a 3-unit line
 * in the cart, leaving the shopper stuck at checkout.
 */
export function addToCart(userId: string, productId: string, quantity = 1): CartMutationResult {
  const product = get<{ id: string; stock: number; status: string }>(
    "SELECT id, stock, status FROM products WHERE id = ?",
    [productId],
  );
  if (!product) return { ok: false, error: "That product no longer exists" };
  if (product.status !== "ACTIVE") return { ok: false, error: "That product is not available right now" };

  const stock = safeInt(product.stock, 0, 0);
  if (stock <= 0) return { ok: false, error: "That product is out of stock" };

  const requested = safeInt(quantity, 1, 1, MAX_LINE_QUANTITY);

  const existing = get<{ id: string; quantity: number }>(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );

  const already = safeInt(existing?.quantity, 0, 0);
  const next = already + requested;

  if (next > MAX_LINE_QUANTITY) {
    return {
      ok: false,
      error:
        already > 0
          ? `You can order at most ${MAX_LINE_QUANTITY} of one item — ${already} are already in your cart`
          : `You can order at most ${MAX_LINE_QUANTITY} of one item`,
    };
  }

  if (next > stock) {
    return {
      ok: false,
      error:
        already > 0
          ? `Only ${stock} in stock — you already have ${already} in your cart`
          : `Only ${stock} in stock`,
    };
  }

  if (existing) {
    run("UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?", [
      next,
      existing.id,
    ]);
    return { ok: true, id: existing.id, quantity: next };
  }

  const id = newId("crt");
  run("INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)", [
    id,
    userId,
    productId,
    next,
  ]);
  return { ok: true, id, quantity: next };
}

/** Sets an absolute quantity. Removing with `0` (or less) is supported. */
export function setCartQuantity(userId: string, productId: string, quantity: number): CartMutationResult {
  const requested = safeInt(quantity, 0, 0, MAX_LINE_QUANTITY);

  if (requested <= 0) {
    const removed = run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [
      userId,
      productId,
    ]).changes;
    return removed > 0 ? { ok: true, quantity: 0 } : { ok: false, error: "That item is not in your cart" };
  }

  const product = get<{ stock: number; status: string }>(
    "SELECT stock, status FROM products WHERE id = ?",
    [productId],
  );
  if (!product || product.status !== "ACTIVE") {
    return { ok: false, error: "That product is not available right now" };
  }

  const stock = safeInt(product.stock, 0, 0);
  if (stock <= 0) return { ok: false, error: "That product is out of stock" };
  if (requested > stock) return { ok: false, error: `Only ${stock} in stock` };

  const changed = run(
    "UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE user_id = ? AND product_id = ?",
    [requested, userId, productId],
  ).changes;

  return changed > 0
    ? { ok: true, quantity: requested }
    : { ok: false, error: "That item is not in your cart" };
}

export function removeFromCart(userId: string, productId: string) {
  return run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [
    userId,
    productId,
  ]).changes;
}

export function clearCart(userId: string) {
  return run("DELETE FROM cart_items WHERE user_id = ?", [userId]).changes;
}

export interface CouponResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  freeShipping: boolean;
  error?: string;
}

export function mapCoupon(row: Record<string, any>): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    type: row.type,
    value: Number(row.value),
    minSpend: Number(row.min_spend),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    isActive: row.is_active === 1,
    startsAt: row.starts_at,
    expiresAt: row.expires_at ?? null,
  };
}

export function validateCoupon(code: string, subtotal: number): CouponResult {
  const row = get("SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)", [code.trim()]);
  if (!row) return { valid: false, discount: 0, freeShipping: false, error: "Coupon code not found" };

  const coupon = mapCoupon(row);
  if (!coupon.isActive) {
    return { valid: false, discount: 0, freeShipping: false, error: "This coupon is no longer active" };
  }
  if (coupon.startsAt && new Date(coupon.startsAt.replace(" ", "T")) > new Date()) {
    return { valid: false, discount: 0, freeShipping: false, error: "This coupon is not active yet" };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt.replace(" ", "T")) < new Date()) {
    return { valid: false, discount: 0, freeShipping: false, error: "This coupon has expired" };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, freeShipping: false, error: "This coupon has reached its usage limit" };
  }
  if (subtotal < coupon.minSpend) {
    return {
      valid: false,
      discount: 0,
      freeShipping: false,
      error: `Minimum spend for this coupon is ${coupon.minSpend.toLocaleString()}`,
    };
  }

  let discount = 0;
  let freeShipping = false;
  if (coupon.type === "PERCENT") discount = (subtotal * coupon.value) / 100;
  else if (coupon.type === "FIXED") discount = coupon.value;
  else freeShipping = true;

  return { valid: true, coupon, discount: Math.min(discount, subtotal), freeShipping };
}

export function calculateTotals(
  lines: CartLine[],
  options: { couponCode?: string | null } = {},
): CartTotals {
  const itemCount = lines.reduce((sum, line) => sum + safeInt(line.quantity, 0, 0), 0);
  const subtotal = round2(lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0));

  let shippingFee = 0;
  if (lines.length > 0) {
    const allFree = lines.every((line) => line.product.freeShipping);
    shippingFee = allFree || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    shippingFee += lines.reduce(
      (sum, line) => sum + (line.product.freeShipping ? 0 : line.product.shippingFee),
      0,
    );
  }
  shippingFee = round2(shippingFee);

  let discount = 0;
  if (options.couponCode) {
    const result = validateCoupon(options.couponCode, subtotal);
    if (result.valid) {
      discount = round2(result.discount);
      if (result.freeShipping) shippingFee = 0;
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * TAX_RATE);
  const total = round2(Math.max(0, taxable + shippingFee + tax));

  return {
    itemCount,
    subtotal,
    shippingFee,
    discount,
    tax,
    total,
    freeShippingRemaining: Math.max(0, round2(FREE_SHIPPING_THRESHOLD - subtotal)),
  };
}
