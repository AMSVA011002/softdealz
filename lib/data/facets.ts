import { all, get } from "@/lib/db";
import { categoryIdsForSlug, listCategories } from "@/lib/data/categories";
import { brandsForCategory, priceBounds } from "@/lib/data/products";
import type { ProductFilters } from "@/lib/types";

export interface Facets {
  categories: Array<{ slug: string; name: string; count: number; parentName: string | null }>;
  brands: Array<{ slug: string; name: string; count: number }>;
  priceBounds: { min: number; max: number };
  conditions: Array<{ value: string; label: string; count: number }>;
}

/**
 * Builds the filter sidebar for a listing page. Counts are computed against
 * the *whole* active catalog so numbers stay stable as filters are applied —
 * conventional marketplace behaviour, and much less confusing for shoppers.
 */
export function buildFacets(filters: ProductFilters = {}): Facets {
  const categories = listCategories();
  const parents = new Map(categories.filter((c) => !c.parentId).map((c) => [c.id, c.name]));

  // Only offer category filters inside the current department, otherwise the
  // list is uselessly long on a global listing.
  let categoryOptions: Facets["categories"] = [];

  if (filters.category) {
    const ids = categoryIdsForSlug(filters.category);
    const scoped = categories.filter((category) => ids.includes(category.id));
    const scopeRoot = scoped.find((category) => category.slug === filters.category);

    const counts = all<{ category_id: string; total: number }>(
      ids.length
        ? `SELECT category_id, COUNT(*) AS total FROM products
            WHERE status = 'ACTIVE' AND category_id IN (${ids.map(() => "?").join(", ")})
            GROUP BY category_id`
        : `SELECT category_id, COUNT(*) AS total FROM products WHERE 1 = 0`,
      ids,
    );
    const countByCategory = new Map(counts.map((row) => [row.category_id, Number(row.total)]));

    categoryOptions = scoped
      .filter((category) => category.slug !== filters.category && category.isActive)
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        count: countByCategory.get(category.id) ?? 0,
        parentName: category.parentId
          ? (parents.get(category.parentId) ?? null)
          : (scopeRoot?.name ?? null),
      }))
      .filter((option) => option.count > 0)
      .sort((a, b) => b.count - a.count);
  } else {
    const counts = all<{ category_id: string; total: number }>(
      `SELECT category_id, COUNT(*) AS total FROM products WHERE status = 'ACTIVE' GROUP BY category_id`,
    );
    const countByCategory = new Map(counts.map((row) => [row.category_id, Number(row.total)]));

    categoryOptions = categories
      .filter((category) => !category.parentId)
      .map((category) => {
        const childTotal = categories
          .filter((child) => child.parentId === category.id)
          .reduce((sum, child) => sum + (countByCategory.get(child.id) ?? 0), 0);
        return {
          slug: category.slug,
          name: category.name,
          count: (countByCategory.get(category.id) ?? 0) + childTotal,
          parentName: null,
        };
      })
      .filter((option) => option.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  const conditions = all<{ condition: string; total: number }>(
    `SELECT condition, COUNT(*) AS total FROM products WHERE status = 'ACTIVE' GROUP BY condition`,
  ).map((row) => ({
    value: String(row.condition),
    label: String(row.condition).charAt(0) + String(row.condition).slice(1).toLowerCase(),
    count: Number(row.total),
  }));

  const bounds = priceBounds(filters.category);
  const fallbackBounds = get<{ min: number | null; max: number | null }>(
    "SELECT MIN(price) AS min, MAX(price) AS max FROM products WHERE status = 'ACTIVE'",
  );

  return {
    categories: categoryOptions.slice(0, 60),
    brands: brandsForCategory(filters.category).slice(0, 40),
    priceBounds:
      bounds.max > 0
        ? bounds
        : { min: Math.floor(Number(fallbackBounds?.min ?? 0)), max: Math.ceil(Number(fallbackBounds?.max ?? 0)) },
    conditions,
  };
}
