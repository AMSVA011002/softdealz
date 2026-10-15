import { all, get, newId, run, scalar, tx } from "@/lib/db";
import { mapAddress, mapProduct } from "@/lib/data/mappers";
import type { Address, Notification, Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

export function listAddresses(userId: string): Address[] {
  return all("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", [
    userId,
  ]).map(mapAddress);
}

export function getAddress(userId: string, id: string): Address | null {
  const row = get("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? mapAddress(row) : null;
}

export interface AddressInput {
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export function createAddress(userId: string, input: AddressInput): string {
  const id = newId("adr");
  return tx(() => {
    if (input.isDefault) {
      run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }
    const hasAny = (scalar<number>("SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?", [
      userId,
    ]) ?? 0) > 0;

    run(
      `INSERT INTO addresses (id, user_id, label, full_name, phone, line1, line2, city, state,
        postal_code, country, is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        userId,
        input.label ?? "Home",
        input.fullName,
        input.phone,
        input.line1,
        input.line2 ?? null,
        input.city,
        input.state,
        input.postalCode,
        input.country ?? "Sri Lanka",
        input.isDefault || !hasAny ? 1 : 0,
      ],
    );
    return id;
  });
}

export function updateAddress(userId: string, id: string, input: Partial<AddressInput>): boolean {
  return tx(() => {
    if (input.isDefault) {
      run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }
    const fields: string[] = [];
    const params: unknown[] = [];
    const assign = (column: string, value: unknown) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if (input.label !== undefined) assign("label", input.label);
    if (input.fullName !== undefined) assign("full_name", input.fullName);
    if (input.phone !== undefined) assign("phone", input.phone);
    if (input.line1 !== undefined) assign("line1", input.line1);
    if (input.line2 !== undefined) assign("line2", input.line2);
    if (input.city !== undefined) assign("city", input.city);
    if (input.state !== undefined) assign("state", input.state);
    if (input.postalCode !== undefined) assign("postal_code", input.postalCode);
    if (input.country !== undefined) assign("country", input.country);
    if (input.isDefault !== undefined) assign("is_default", input.isDefault ? 1 : 0);
    if (!fields.length) return false;
    params.push(id, userId);
    return (
      run(`UPDATE addresses SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params)
        .changes > 0
    );
  });
}

export function deleteAddress(userId: string, id: string): boolean {
  return run("DELETE FROM addresses WHERE id = ? AND user_id = ?", [id, userId]).changes > 0;
}

/* ------------------------------------------------------------------ */
/* Wishlist                                                            */
/* ------------------------------------------------------------------ */

export interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export function listWishlist(userId: string): WishlistEntry[] {
  const rows = all(
    `SELECT w.id AS wishlist_id, w.created_at AS wishlist_created,
            p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name
       FROM wishlist_items w
       JOIN products p ON p.id = w.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.wishlist_id),
    userId,
    productId: String(row.id),
    createdAt: String(row.wishlist_created),
    product: mapProduct(row),
  }));
}

export interface WishlistToggleResult {
  ok: boolean;
  added: boolean;
  error?: string;
}

/**
 * Adds or removes a wishlist entry. The product is verified first: inserting an
 * unknown id used to trip the foreign key and blow up as a 500.
 */
export function toggleWishlist(userId: string, productId: string): WishlistToggleResult {
  if (typeof productId !== "string" || !productId.trim()) {
    return { ok: false, added: false, error: "A product is required" };
  }

  const existing = get<{ id: string }>(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );
  if (existing) {
    run("DELETE FROM wishlist_items WHERE id = ?", [existing.id]);
    return { ok: true, added: false };
  }

  const product = get<{ id: string; status: string }>(
    "SELECT id, status FROM products WHERE id = ?",
    [productId],
  );
  if (!product) return { ok: false, added: false, error: "That product no longer exists" };
  if (product.status === "ARCHIVED") {
    return { ok: false, added: false, error: "That product is no longer available" };
  }

  run("INSERT INTO wishlist_items (id, user_id, product_id) VALUES (?,?,?)", [
    newId("wsh"),
    userId,
    productId,
  ]);
  return { ok: true, added: true };
}

export function isWishlisted(userId: string, productId: string): boolean {
  return (
    (scalar<number>(
      "SELECT COUNT(*) AS total FROM wishlist_items WHERE user_id = ? AND product_id = ?",
      [userId, productId],
    ) ?? 0) > 0
  );
}

export function wishlistIds(userId: string): string[] {
  return all<{ product_id: string }>(
    "SELECT product_id FROM wishlist_items WHERE user_id = ?",
    [userId],
  ).map((row) => row.product_id);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function listNotifications(userId: string, limit = 20): Notification[] {
  return all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  ).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    type: String(row.type),
    read: row.read === 1,
    createdAt: String(row.created_at),
  }));
}

export function unreadCount(userId: string): number {
  return (
    scalar<number>(
      "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read = 0",
      [userId],
    ) ?? 0
  );
}

export function markAllRead(userId: string) {
  run("UPDATE notifications SET read = 1 WHERE user_id = ?", [userId]);
}

export function markRead(userId: string, id: string) {
  run("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?", [id, userId]);
}

export function pushNotification(
  userId: string,
  title: string,
  body: string,
  type = "INFO",
) {
  run("INSERT INTO notifications (id, user_id, title, body, type) VALUES (?,?,?,?,?)", [
    newId("ntf"),
    userId,
    title,
    body,
    type,
  ]);
}

/* ------------------------------------------------------------------ */
/* Settings + newsletter                                               */
/* ------------------------------------------------------------------ */

export function getSetting(key: string, fallback = ""): string {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  run(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    [key, value],
  );
}

export function allSettings(): Record<string, string> {
  const out: Record<string, string> = {};
  all<{ key: string; value: string }>("SELECT key, value FROM settings").forEach((row) => {
    out[row.key] = row.value;
  });
  return out;
}

export function subscribeNewsletter(email: unknown): { ok: boolean; error?: string; alreadySubscribed?: boolean } {
  if (typeof email !== "string") return { ok: false, error: "Enter a valid email address" };

  const clean = email.trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, error: "Enter a valid email address" };
  const existing = get<{ id: string }>(
    "SELECT id FROM newsletter_subscribers WHERE email = ?",
    [clean],
  );
  if (existing) return { ok: true };
  run("INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)", [newId("sub"), clean]);
  return { ok: true };
}

export function countSubscribers(): number {
  return scalar<number>("SELECT COUNT(*) AS total FROM newsletter_subscribers") ?? 0;
}

export function listSubscribers(limit = 200) {
  return all("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ?", [limit]).map(
    (row) => ({ id: String(row.id), email: String(row.email), createdAt: String(row.created_at) }),
  );
}
