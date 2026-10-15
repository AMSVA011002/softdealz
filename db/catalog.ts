/**
 * Loads and normalises the JSON catalog files in `db/catalog/`.
 * Used by both the seeder and the asset generator so artwork and data always match.
 */
import fs from "node:fs";
import path from "node:path";

export interface RawProduct {
  t: string;
  p: number;
  w?: number | null;
  b: string;
  i?: string;
  s?: number;
  r?: number;
  f?: number;
}

export interface RawCategory {
  name: string;
  slug: string;
  icon: string;
  featured?: boolean;
  tagline?: string;
  children: Array<{
    name: string;
    slug: string;
    icon: string;
    products: RawProduct[];
  }>;
}

export interface RawBrand {
  name: string;
  slug: string;
}

export interface Catalog {
  brands: RawBrand[];
  categories: RawCategory[];
}

const CATALOG_DIR = path.join(process.cwd(), "db", "catalog");

export function loadCatalog(): Catalog {
  const files = fs
    .readdirSync(CATALOG_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const catalog: Catalog = { brands: [], categories: [] };

  for (const file of files) {
    const parsed = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, file), "utf8")) as Partial<Catalog>;
    if (parsed.brands) catalog.brands.push(...parsed.brands);
    if (parsed.categories) catalog.categories.push(...parsed.categories);
  }

  // De-duplicate brands by slug (files may be merged in any order).
  const seen = new Set<string>();
  catalog.brands = catalog.brands.filter((brand) => {
    if (seen.has(brand.slug)) return false;
    seen.add(brand.slug);
    return true;
  });

  return catalog;
}

/** Every product leaf in the catalog with its category context resolved. */
export function flattenProducts(catalog: Catalog) {
  const rows: Array<{
    parent: RawCategory;
    child: RawCategory["children"][number];
    product: RawProduct;
  }> = [];

  catalog.categories.forEach((parent) => {
    parent.children.forEach((child) => {
      child.products.forEach((product) => {
        rows.push({ parent, child, product });
      });
    });
  });

  return rows;
}
