import { all, get, newId, run } from "@/lib/db";
import { mapCoupon } from "@/lib/data/cart";
import type { Coupon } from "@/lib/types";

export function listCoupons(activeOnly = false): Coupon[] {
  const rows = activeOnly
    ? all("SELECT * FROM coupons WHERE is_active = 1 ORDER BY created_at DESC")
    : all("SELECT * FROM coupons ORDER BY created_at DESC");
  return rows.map(mapCoupon);
}

export function getCouponById(id: string): Coupon | null {
  const row = get("SELECT * FROM coupons WHERE id = ?", [id]);
  return row ? mapCoupon(row) : null;
}

export interface CouponInput {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSpend: number;
  maxUses: number;
  isActive: boolean;
  expiresAt?: string | null;
}

export function createCoupon(input: CouponInput): string {
  const id = newId("cpn");
  run(
    `INSERT INTO coupons (id, code, description, type, value, min_spend, max_uses, is_active, expires_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.code.toUpperCase().trim(),
      input.description,
      input.type,
      input.value,
      input.minSpend,
      input.maxUses,
      input.isActive ? 1 : 0,
      input.expiresAt ?? null,
    ],
  );
  return id;
}

export function updateCoupon(id: string, input: Partial<CouponInput>): boolean {
  const fields: string[] = [];
  const params: unknown[] = [];
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    params.push(value);
  };

  if (input.code !== undefined) assign("code", input.code.toUpperCase().trim());
  if (input.description !== undefined) assign("description", input.description);
  if (input.type !== undefined) assign("type", input.type);
  if (input.value !== undefined) assign("value", input.value);
  if (input.minSpend !== undefined) assign("min_spend", input.minSpend);
  if (input.maxUses !== undefined) assign("max_uses", input.maxUses);
  if (input.isActive !== undefined) assign("is_active", input.isActive ? 1 : 0);
  if (input.expiresAt !== undefined) assign("expires_at", input.expiresAt);

  if (!fields.length) return false;
  params.push(id);
  return run(`UPDATE coupons SET ${fields.join(", ")} WHERE id = ?`, params).changes > 0;
}

export function deleteCoupon(id: string): boolean {
  return run("DELETE FROM coupons WHERE id = ?", [id]).changes > 0;
}

export function activePromotions(limit = 4): Coupon[] {
  return all(
    `SELECT * FROM coupons
      WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY min_spend ASC LIMIT ?`,
    [limit],
  ).map(mapCoupon);
}
