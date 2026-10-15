import { all, get, parseJson, scalar } from "@/lib/db";
import { mapCategory } from "@/lib/data/mappers";
import type { Category } from "@/lib/types";

const PRODUCT_COUNT_SQL = `
  (SELECT COUNT(*) FROM products p
    WHERE p.category_id = c.id AND p.status = 'ACTIVE') AS product_count`;

export function listCategories(options: { activeOnly?: boolean } = {}): Category[] {
  const where = options.activeOnly === false ? "" : "WHERE c.is_active = 1";
  const rows = all(
    `SELECT c.*, ${PRODUCT_COUNT_SQL} FROM categories c ${where}
     ORDER BY c.position ASC, c.name ASC`,
  );
  return rows.map(mapCategory);
}

export function getCategoryBySlug(slug: string): Category | null {
  const row = get(`SELECT c.*, ${PRODUCT_COUNT_SQL} FROM categories c WHERE c.slug = ?`, [
    slug,
  ]);
  return row ? mapCategory(row) : null;
}

export function getCategoryById(id: string): Category | null {
  const row = get(`SELECT c.*, ${PRODUCT_COUNT_SQL} FROM categories c WHERE c.id = ?`, [id]);
  return row ? mapCategory(row) : null;
}

/**
 * Category tree: top-level categories with nested children.
 * Parent counts roll up their children so a department tile shows a real total.
 */
export function getCategoryTree(options: { activeOnly?: boolean } = {}): Category[] {
  const flat = listCategories(options);
  const byId = new Map<string, Category>();
  flat.forEach((category) => byId.set(category.id, { ...category, children: [] }));

  const roots: Category[] = [];
  byId.forEach((category) => {
    if (category.parentId && byId.has(category.parentId)) {
      byId.get(category.parentId)!.children!.push(category);
    } else {
      roots.push(category);
    }
  });

  roots.forEach((root) => {
    const childTotal = (root.children ?? []).reduce(
      (sum, child) => sum + (child.productCount ?? 0),
      0,
    );
    root.productCount = (root.productCount ?? 0) + childTotal;
  });

  return roots;
}

/** All category ids in a subtree (the category itself plus descendants). */
export function categoryIdsForSlug(slug: string): string[] {
  const rows = all<{ id: string }>(
    `WITH RECURSIVE tree(id) AS (
       SELECT id FROM categories WHERE slug = ?
       UNION ALL
       SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
     )
     SELECT id FROM tree`,
    [slug],
  );
  return rows.map((row) => row.id);
}

/** Slugs of a category plus every ancestor, for breadcrumbs. */
export function categoryBreadcrumbs(slug: string): Category[] {
  const rows = all(
    `WITH RECURSIVE tree(id, name, slug, parent_id, depth) AS (
       SELECT id, name, slug, parent_id, 0 FROM categories WHERE slug = ?
       UNION ALL
       SELECT c.id, c.name, c.slug, c.parent_id, t.depth + 1
         FROM categories c JOIN tree t ON c.id = t.parent_id
     )
     SELECT id, name, slug, parent_id FROM tree ORDER BY depth DESC`,
    [slug],
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    parentId: (row.parent_id as string) ?? null,
    description: null,
    image: null,
    icon: null,
    color: "#0c800f",
    featured: false,
    position: 0,
    isActive: true,
    createdAt: "",
  }));
}

export function featuredCategories(limit = 12): Category[] {
  const rows = all(
    `WITH RECURSIVE category_descendants(root_id, descendant_id) AS (
       SELECT id, id FROM categories WHERE is_active = 1 AND featured = 1
       UNION ALL
       SELECT tree.root_id, child.id
         FROM category_descendants tree
         JOIN categories child ON child.parent_id = tree.descendant_id
        WHERE child.is_active = 1
     )
     SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN category_descendants tree ON tree.root_id = c.id
       LEFT JOIN products p
         ON p.category_id = tree.descendant_id AND p.status = 'ACTIVE'
      WHERE c.is_active = 1 AND c.featured = 1
      GROUP BY c.id
      ORDER BY c.position ASC LIMIT ?`,
    [limit],
  );
  return rows.map(mapCategory);
}

export function categoryStats(): Array<{ id: string; name: string; count: number }> {
  const rows = all(
    `SELECT c.id, c.name, COUNT(p.id) AS count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id ORDER BY c.position`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    count: Number(row.count ?? 0),
  }));
}

export function categoryProductTotals(): Record<string, number> {
  const rows = all<{ parent_id: string | null; id: string; total: number }>(
    `SELECT c.parent_id, c.id, COUNT(p.id) AS total
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.status = 'ACTIVE'
      GROUP BY c.id`,
  );
  const totals: Record<string, number> = {};
  const parentOf = new Map<string, string | null>();

  rows.forEach((row) => {
    totals[row.id] = Number(row.total ?? 0);
    parentOf.set(row.id, row.parent_id);
  });

  // Roll child counts up into their parents so top-level tiles show a real number.
  rows.forEach((row) => {
    const parent = row.parent_id;
    if (parent && totals[parent] !== undefined) {
      totals[parent] += Number(row.total ?? 0);
    }
  });

  return totals;
}

/**
 * Flat, ordered list of categories with a `depth` for indenting <select>
 * options and admin tables. Children follow their parent.
 */
export function listCategoriesFlat(options: { activeOnly?: boolean } = {}): Array<{
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  productCount: number;
}> {
  const rows = listCategories(options);
  const byParent = new Map<string | null, Category[]>();

  rows.forEach((row) => {
    const key = row.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  });

  const out: Array<{
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    productCount: number;
  }> = [];

  const walk = (parentId: string | null, depth: number) => {
    (byParent.get(parentId) ?? []).forEach((row) => {
      out.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parentId ?? null,
        depth,
        productCount: row.productCount ?? 0,
      });
      walk(row.id, depth + 1);
    });
  };

  walk(null, 0);
  return out;
}

export function categoryImage(slug: string): string | null {
  const row = get<{ image: string | null }>(`SELECT image FROM categories WHERE slug = ?`, [
    slug,
  ]);
  return row?.image ?? null;
}

export function parseCategoryMeta(row: Record<string, unknown>) {
  return { ...mapCategory(row), extra: parseJson(row.meta, {}) };
}

export function countCategories(): number {
  return scalar<number>(`SELECT COUNT(*) AS total FROM categories`) ?? 0;
}
