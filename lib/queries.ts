import { firstParam, intParam, listParam, numberParam, type ParamValue } from "@/lib/params";
import type { ProductFilters, SortKey } from "@/lib/types";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function first(value: ParamValue): string | undefined {
  return firstParam(value);
}

function list(value: ParamValue): string[] {
  return listParam(value);
}

const SORT_KEYS: SortKey[] = ["relevance", "newest", "price-asc", "price-desc", "rating", "popular"];

/**
 * Normalises Next.js `searchParams` into the typed filter object the data layer
 * expects. Every numeric field is sanitised (an invalid `?page=abc` used to reach
 * SQLite as `NaN`, which the driver rejects with a 500) and unknown sort keys
 * fall back to relevance.
 */
export function parseProductFilters(searchParams: SearchParamsRecord = {}): ProductFilters {
  const sortParam = first(searchParams.sort) as SortKey | undefined;

  return {
    q: first(searchParams.q)?.slice(0, 120).trim() || undefined,
    category: first(searchParams.category)?.slice(0, 120) || undefined,
    brand: list(searchParams.brand).slice(0, 40),
    minPrice: numberParam(searchParams.minPrice, { min: 0 }),
    maxPrice: numberParam(searchParams.maxPrice, { min: 0 }),
    minRating: numberParam(searchParams.rating, { min: 0, max: 5 }),
    condition: list(searchParams.condition).slice(0, 5),
    inStock: first(searchParams.stock) === "1",
    freeShipping: first(searchParams.shipping) === "1",
    onSale: first(searchParams.sale) === "1",
    sort: sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "relevance",
    page: intParam(searchParams.page, 1, { min: 1, max: 10_000 }),
    perPage: intParam(searchParams.perPage, 24, { min: 8, max: 96 }),
  };
}

/** Builds a page link that preserves the current filters. */
export function pageHrefFactory(basePath: string, searchParams: SearchParamsRecord = {}) {
  return (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "page" || value === undefined) return;
      if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
      else params.set(key, value);
    });
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
}

/**
 * Builds the `{page}` href template the client-side <Pagination /> substitutes.
 * Keeping it a string means no function crosses the server/client boundary.
 */
export function pageHrefTemplate(basePath: string, searchParams: SearchParamsRecord = {}) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "page" || value === undefined) return;
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else params.set(key, value);
  });
  params.set("page", "{page}");
  return `${basePath}?${params.toString()}`;
}
