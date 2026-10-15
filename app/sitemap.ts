import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { listCategories } from "@/lib/data/categories";
import { all } from "@/lib/db";

export const revalidate = 3600;

/**
 * Public routes plus every active product and category. Private or
 * transactional pages (cart, checkout, account, admin) are intentionally
 * excluded — they are also disallowed in `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/track`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let categoryEntries: MetadataRoute.Sitemap = [];
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    categoryEntries = listCategories().map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    productEntries = all<{ slug: string; updated_at: string | null }>(
      "SELECT slug, updated_at FROM products WHERE status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 5000",
    ).map((row) => ({
      url: `${base}/product/${row.slug}`,
      lastModified: row.updated_at ? new Date(`${row.updated_at.replace(" ", "T")}Z`) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // A build without a migrated database should still produce a valid sitemap.
    return staticEntries;
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
