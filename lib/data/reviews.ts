import { all, get, newId, run, scalar } from "@/lib/db";
import { mapReview } from "@/lib/data/mappers";
import { refreshProductRating } from "@/lib/data/products";
import { safeInt } from "@/lib/numbers";
import type { Review } from "@/lib/types";

export function listProductReviews(
  productId: string,
  options: { status?: string; limit?: number } = {},
): Review[] {
  const status = options.status ?? "APPROVED";
  const rows = all(
    `SELECT * FROM reviews WHERE product_id = ? AND status = ?
      ORDER BY helpful DESC, created_at DESC LIMIT ?`,
    [productId, status, safeInt(options.limit, 50, 1, 200)],
  );
  return rows.map(mapReview);
}

export function ratingSummary(productId: string) {
  const rows = all<{ rating: number; total: number }>(
    `SELECT rating, COUNT(*) AS total FROM reviews
      WHERE product_id = ? AND status = 'APPROVED' GROUP BY rating`,
    [productId],
  );
  const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  rows.forEach((row) => {
    const rating = Number(row.rating);
    const count = Number(row.total);
    buckets[rating] = count;
    total += count;
    sum += rating * count;
  });
  return { buckets, total, average: total ? sum / total : 0 };
}

export function createReview(input: {
  productId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  status?: string;
}): string {
  const id = newId("rev");
  run(
    `INSERT INTO reviews (id, product_id, user_id, author_name, rating, title, body, status)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      input.productId,
      input.userId,
      input.authorName,
      Math.min(5, Math.max(1, Math.round(input.rating))),
      input.title ?? null,
      input.body.trim(),
      input.status ?? "APPROVED",
    ],
  );
  refreshProductRating(input.productId);
  return id;
}

export function hasReviewed(userId: string, productId: string): boolean {
  const row = get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM reviews WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );
  return Number(row?.total ?? 0) > 0;
}

export function markHelpful(reviewId: string) {
  return run("UPDATE reviews SET helpful = helpful + 1 WHERE id = ?", [reviewId]).changes > 0;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export function listReviewsAdmin(options: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
} = {}): Review[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.status && options.status !== "ALL") {
    conditions.push("r.status = ?");
    params.push(options.status);
  }
  if (options.q) {
    conditions.push("(LOWER(r.body) LIKE ? OR LOWER(r.author_name) LIKE ? OR LOWER(p.title) LIKE ?)");
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like, like);
  }

  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = all(
    `SELECT r.*, p.title AS product_title, p.slug AS product_slug
       FROM reviews r LEFT JOIN products p ON p.id = r.product_id
       ${clause}
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeInt(options.limit, 100, 1, 200), safeInt(options.offset, 0, 0, 1_000_000)],
  );
  return rows.map(mapReview);
}

/** Total review count for the current admin filters (for pagination). */
export function countReviewsFiltered(options: { status?: string; q?: string } = {}): number {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.status && options.status !== "ALL") {
    conditions.push("r.status = ?");
    params.push(options.status);
  }
  if (options.q) {
    conditions.push("(LOWER(r.body) LIKE ? OR LOWER(r.author_name) LIKE ? OR LOWER(p.title) LIKE ?)");
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like, like);
  }

  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return (
    scalar<number>(
      `SELECT COUNT(*) AS total FROM reviews r LEFT JOIN products p ON p.id = r.product_id ${clause}`,
      params,
    ) ?? 0
  );
}

/** Average rating across every approved review in the store. */
export function overallRating(): { average: number; total: number } {
  const row = get<{ average: number | null; total: number }>(
    `SELECT AVG(rating) AS average, COUNT(*) AS total FROM reviews WHERE status = 'APPROVED'`,
  );
  return { average: Number(row?.average ?? 0), total: Number(row?.total ?? 0) };
}

export function setReviewStatus(reviewId: string, status: string): boolean {
  const row = get<{ product_id: string }>("SELECT product_id FROM reviews WHERE id = ?", [
    reviewId,
  ]);
  if (!row) return false;

  const changed = run("UPDATE reviews SET status = ? WHERE id = ?", [status, reviewId]).changes > 0;
  refreshProductRating(row.product_id);
  return changed;
}

export function deleteReview(reviewId: string): boolean {
  const row = get<{ product_id: string }>("SELECT product_id FROM reviews WHERE id = ?", [
    reviewId,
  ]);
  if (!row) return false;
  const changed = run("DELETE FROM reviews WHERE id = ?", [reviewId]).changes > 0;
  refreshProductRating(row.product_id);
  return changed;
}

export function countReviews(status?: string): number {
  return status
    ? (scalar<number>("SELECT COUNT(*) AS total FROM reviews WHERE status = ?", [status]) ?? 0)
    : (scalar<number>("SELECT COUNT(*) AS total FROM reviews") ?? 0);
}

export function recentReviews(limit = 5): Review[] {
  return all(
    `SELECT r.*, p.title AS product_title, p.slug AS product_slug
       FROM reviews r LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC LIMIT ?`,
    [limit],
  ).map(mapReview);
}
