import { all, get, newId, run, scalar } from "@/lib/db";
import { mapProduct } from "@/lib/data/mappers";
import { categoryIdsForSlug } from "@/lib/data/categories";
import { safeInt } from "@/lib/numbers";
import type { Paginated, Product, ProductFilters, SortKey, Spec } from "@/lib/types";

const SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id`;

const SORTS: Record<SortKey, string> = {
  relevance: "p.is_featured DESC, p.sold_count DESC",
  newest: "p.created_at DESC",
  "price-asc": "p.price ASC",
  "price-desc": "p.price DESC",
  rating: "p.rating DESC, p.review_count DESC",
  popular: "p.sold_count DESC, p.view_count DESC",
};

interface BuiltWhere {
  clause: string;
  params: unknown[];
}

function buildWhere(filters: ProductFilters, includeInactive = false): BuiltWhere {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!includeInactive) conditions.push("p.status = 'ACTIVE'");

  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      `(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?
        OR LOWER(COALESCE(b.name, '')) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ?)`,
    );
    params.push(term, term, term, term, term);
  }

  if (filters.category) {
    const ids = categoryIdsForSlug(filters.category);
    if (ids.length === 0) return { clause: "WHERE 1 = 0", params: [] };
    conditions.push(`p.category_id IN (${ids.map(() => "?").join(", ")})`);
    params.push(...ids);
  }

  if (filters.brand?.length) {
    conditions.push(
      `b.slug IN (${filters.brand.map(() => "?").join(", ")})`,
    );
    params.push(...filters.brand);
  }

  if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) {
    conditions.push("p.price >= ?");
    params.push(filters.minPrice);
  }
  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
    conditions.push("p.price <= ?");
    params.push(filters.maxPrice);
  }
  if (typeof filters.minRating === "number" && filters.minRating > 0 && Number.isFinite(filters.minRating)) {
    conditions.push("p.rating >= ?");
    params.push(filters.minRating);
  }
  if (filters.condition?.length) {
    conditions.push(`p.condition IN (${filters.condition.map(() => "?").join(", ")})`);
    params.push(...filters.condition);
  }
  if (filters.inStock) conditions.push("p.stock > 0");
  if (filters.freeShipping) conditions.push("p.free_shipping = 1");
  if (filters.onSale) {
    conditions.push("p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price");
  }
  if (filters.flashDealsOnly) conditions.push("p.is_flash_deal = 1");

  return {
    clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export function searchProducts(filters: ProductFilters = {}): Paginated<Product> {
  const page = safeInt(filters.page, 1, 1, 10_000);
  const perPage = safeInt(filters.perPage, 24, 1, 96);
  const offset = (page - 1) * perPage;
  const { clause, params } = buildWhere(filters);
  const orderBy = SORTS[filters.sort ?? "relevance"] ?? SORTS.relevance;

  const countRow = get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ${clause}`,
    params,
  );
  const total = Number(countRow?.total ?? 0);

  const rows = all(
    `${SELECT} ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, perPage, offset],
  );

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    items: rows.map(mapProduct),
    total,
    page,
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function getProductBySlug(slug: string): Product | null {
  const row = get(`${SELECT} WHERE p.slug = ?`, [slug]);
  return row ? mapProduct(row) : null;
}

export function getProductById(id: string): Product | null {
  const row = get(`${SELECT} WHERE p.id = ?`, [id]);
  return row ? mapProduct(row) : null;
}

export function getProductsByIds(ids: string[]): Product[] {
  if (ids.length === 0) return [];
  const rows = all(
    `${SELECT} WHERE p.id IN (${ids.map(() => "?").join(", ")})`,
    ids,
  );
  return rows.map(mapProduct);
}

export function activeProductsByIds(ids: string[]): Product[] {
  if (ids.length === 0) return [];
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' AND p.id IN (${ids.map(() => "?").join(", ")})`,
    ids,
  );
  return rows.map(mapProduct);
}

export function incrementProductViews(id: string) {
  run("UPDATE products SET view_count = view_count + 1 WHERE id = ?", [id]);
}

export function relatedProducts(product: Product, limit = 8): Product[] {
  const rows = all(
    `${SELECT} WHERE p.category_id = ? AND p.id != ? AND p.status = 'ACTIVE'
      ORDER BY p.sold_count DESC LIMIT ?`,
    [product.categoryId, product.id, limit],
  );
  return rows.map(mapProduct);
}

export function featuredProducts(limit = 10): Product[] {
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' AND p.is_featured = 1
      ORDER BY p.rating DESC, p.sold_count DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapProduct);
}

export function trendingProducts(limit = 10): Product[] {
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE'
      ORDER BY p.sold_count DESC, p.view_count DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapProduct);
}

export function newArrivals(limit = 10): Product[] {
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' ORDER BY p.created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapProduct);
}

export function dealProducts(limit = 12): Product[] {
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' AND p.is_flash_deal = 1 AND p.compare_at_price IS NOT NULL
       AND p.compare_at_price > p.price
     ORDER BY (p.compare_at_price - p.price) / p.compare_at_price DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapProduct);
}

export function bestSellersInCategory(categorySlug: string, limit = 6): Product[] {
  const ids = categoryIdsForSlug(categorySlug);
  if (ids.length === 0) return [];
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' AND p.category_id IN (${ids
      .map(() => "?")
      .join(", ")})
     ORDER BY p.sold_count DESC LIMIT ?`,
    [...ids, limit],
  );
  return rows.map(mapProduct);
}

export function brandsForCategory(categorySlug?: string): Array<{ slug: string; name: string; count: number }> {
  const params: unknown[] = [];
  let clause = "WHERE p.status = 'ACTIVE' AND b.id IS NOT NULL";
  if (categorySlug) {
    const ids = categoryIdsForSlug(categorySlug);
    if (ids.length === 0) return [];
    clause += ` AND p.category_id IN (${ids.map(() => "?").join(", ")})`;
    params.push(...ids);
  }
  const rows = all(
    `SELECT b.slug, b.name, COUNT(p.id) AS count
       FROM products p JOIN brands b ON b.id = p.brand_id
       ${clause}
      GROUP BY b.id ORDER BY count DESC, b.name ASC`,
    params,
  );
  return rows.map((row) => ({
    slug: String(row.slug),
    name: String(row.name),
    count: Number(row.count),
  }));
}

export function priceBounds(categorySlug?: string): { min: number; max: number } {
  const params: unknown[] = [];
  let clause = "WHERE status = 'ACTIVE'";
  if (categorySlug) {
    const ids = categoryIdsForSlug(categorySlug);
    if (ids.length === 0) return { min: 0, max: 0 };
    clause += ` AND category_id IN (${ids.map(() => "?").join(", ")})`;
    params.push(...ids);
  }
  const row = get<{ min: number | null; max: number | null }>(
    `SELECT MIN(price) AS min, MAX(price) AS max FROM products ${clause}`,
    params,
  );
  return { min: Math.floor(Number(row?.min ?? 0)), max: Math.ceil(Number(row?.max ?? 0)) };
}

export function searchSuggestions(term: string, limit = 6): Product[] {
  if (!term.trim()) return [];
  const like = `%${term.toLowerCase()}%`;
  const rows = all(
    `${SELECT} WHERE p.status = 'ACTIVE' AND LOWER(p.title) LIKE ?
      ORDER BY p.sold_count DESC LIMIT ?`,
    [like, limit],
  );
  return rows.map(mapProduct);
}

/* ------------------------------------------------------------------ */
/* Admin helpers                                                       */
/* ------------------------------------------------------------------ */

export function adminListProducts(options: {
  q?: string;
  status?: string;
  categoryId?: string;
  flashDealsOnly?: boolean;
  page?: number;
  perPage?: number;
  sort?: string;
}): Paginated<Product> {
  const page = safeInt(options.page, 1, 1, 10_000);
  const perPage = safeInt(options.perPage, 20, 5, 100);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.q) {
    conditions.push("(LOWER(p.title) LIKE ? OR LOWER(p.sku) LIKE ?)");
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like);
  }
  if (options.status && options.status !== "ALL") {
    conditions.push("p.status = ?");
    params.push(options.status);
  }
  if (options.categoryId && options.categoryId !== "ALL") {
    conditions.push("p.category_id = ?");
    params.push(options.categoryId);
  }
  if (options.flashDealsOnly) conditions.push("p.is_flash_deal = 1");

  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total =
    Number(
      get<{ total: number }>(`SELECT COUNT(*) AS total FROM products p ${clause}`, params)
        ?.total ?? 0,
    );
  const orderBy =
    options.sort === "price" ? "p.price DESC" : options.sort === "stock" ? "p.stock ASC" : "p.updated_at DESC";

  const rows = all(`${SELECT} ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [
    ...params,
    perPage,
    (page - 1) * perPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    items: rows.map(mapProduct),
    total,
    page,
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export interface ProductInput {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockAlert?: number;
  images: string[];
  tags?: string[];
  condition?: string;
  status?: string;
  isFeatured?: boolean;
  isFlashDeal?: boolean;
  freeShipping?: boolean;
  shippingFee?: number;
  warranty?: string | null;
  categoryId: string;
  brandId?: string | null;
  specs?: Spec[];
}

export function createProduct(input: ProductInput): string {
  const id = newId("prd");
  const sku = `SD-${id.replace(/^prd_/, "").toUpperCase()}`;
  run(
    `INSERT INTO products (
      id, title, slug, sku, description, short_description, price, compare_at_price,
      cost_price, stock, low_stock_alert, images, tags, condition, status, is_featured,
      is_flash_deal, free_shipping, shipping_fee, warranty, category_id, brand_id, specs, sold_count
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.title,
      input.slug,
      sku,
      input.description,
      input.shortDescription ?? null,
      input.price,
      input.compareAtPrice ?? null,
      input.costPrice ?? null,
      input.stock,
      input.lowStockAlert ?? 5,
      JSON.stringify(input.images),
      (input.tags ?? []).join(","),
      input.condition ?? "NEW",
      input.status ?? "ACTIVE",
      input.isFeatured ? 1 : 0,
      input.isFlashDeal ? 1 : 0,
      input.freeShipping ? 1 : 0,
      input.shippingFee ?? 0,
      input.warranty ?? null,
      input.categoryId,
      input.brandId ?? null,
      JSON.stringify(input.specs ?? []),
      0,
    ],
  );
  return id;
}

export function updateProduct(id: string, input: Partial<ProductInput>): boolean {
  const fields: string[] = [];
  const params: unknown[] = [];

  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    params.push(value);
  };

  if (input.title !== undefined) assign("title", input.title);
  if (input.slug !== undefined) assign("slug", input.slug);
  if (input.description !== undefined) assign("description", input.description);
  if (input.shortDescription !== undefined) assign("short_description", input.shortDescription);
  if (input.price !== undefined) assign("price", input.price);
  if (input.compareAtPrice !== undefined) assign("compare_at_price", input.compareAtPrice);
  if (input.costPrice !== undefined) assign("cost_price", input.costPrice);
  if (input.stock !== undefined) assign("stock", input.stock);
  if (input.lowStockAlert !== undefined) assign("low_stock_alert", input.lowStockAlert);
  if (input.images !== undefined) assign("images", JSON.stringify(input.images));
  if (input.tags !== undefined) assign("tags", input.tags.join(","));
  if (input.condition !== undefined) assign("condition", input.condition);
  if (input.status !== undefined) assign("status", input.status);
  if (input.isFeatured !== undefined) assign("is_featured", input.isFeatured ? 1 : 0);
  if (input.isFlashDeal !== undefined) assign("is_flash_deal", input.isFlashDeal ? 1 : 0);
  if (input.freeShipping !== undefined) assign("free_shipping", input.freeShipping ? 1 : 0);
  if (input.shippingFee !== undefined) assign("shipping_fee", input.shippingFee);
  if (input.warranty !== undefined) assign("warranty", input.warranty);
  if (input.categoryId !== undefined) assign("category_id", input.categoryId);
  if (input.brandId !== undefined) assign("brand_id", input.brandId);
  if (input.specs !== undefined) assign("specs", JSON.stringify(input.specs));

  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  params.push(id);

  const result = run(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, params);
  return result.changes > 0;
}

export function deleteProduct(id: string): boolean {
  return run("DELETE FROM products WHERE id = ?", [id]).changes > 0;
}

export function adjustStock(id: string, delta: number) {
  run("UPDATE products SET stock = MAX(0, stock + ?), updated_at = datetime('now') WHERE id = ?", [
    delta,
    id,
  ]);
}

/** Recomputes the denormalised rating + review count after a review changes. */
export function refreshProductRating(productId: string) {
  const row = get<{ avg: number | null; total: number }>(
    `SELECT AVG(rating) AS avg, COUNT(*) AS total FROM reviews
      WHERE product_id = ? AND status = 'APPROVED'`,
    [productId],
  );
  const average = Number(row?.avg ?? 0);
  run("UPDATE products SET rating = ?, review_count = ? WHERE id = ?", [
    Number.isFinite(average) ? Number(average.toFixed(1)) : 0,
    Number(row?.total ?? 0),
    productId,
  ]);
}

export function countProducts(): number {
  return scalar<number>("SELECT COUNT(*) AS total FROM products") ?? 0;
}

export function countLowStock(): number {
  return (
    scalar<number>(
      "SELECT COUNT(*) AS total FROM products WHERE stock <= low_stock_alert AND status = 'ACTIVE'",
    ) ?? 0
  );
}

export function lowStockProducts(limit = 8): Product[] {
  const rows = all(
    `${SELECT} WHERE p.stock <= p.low_stock_alert AND p.status = 'ACTIVE'
      ORDER BY p.stock ASC LIMIT ?`,
    [limit],
  );
  return rows.map(mapProduct);
}
