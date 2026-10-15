import { NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { ok } from "@/lib/api";
import { RATE_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 80;

/** Typeahead for the header search box. */
export async function GET(request: NextRequest) {
  const limit = rateLimit(
    `search:${clientIp(request)}`,
    RATE_LIMITS.track.limit,
    RATE_LIMITS.track.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return ok({ products: [], categories: [], throttled: true });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";
  if (query.length < 2) return ok({ products: [], categories: [] });

  const lowered = query.toLowerCase();

  const products = searchSuggestions(query, 5).map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    image: product.images[0] ?? "/images/products/placeholder.svg",
    categoryName: product.categoryName ?? null,
  }));

  const categories = listCategories()
    .filter((category) => category.name.toLowerCase().includes(lowered))
    .slice(0, 3)
    .map((category) => ({ id: category.id, name: category.name, slug: category.slug }));

  return ok({ products, categories, href: `/search?q=${encodeURIComponent(query)}` });
}
