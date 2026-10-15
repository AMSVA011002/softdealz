import { activeProductsByIds } from "@/lib/data/products";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rawIds = new URL(request.url).searchParams.get("ids") ?? "";
  const requestedIds = rawIds ? rawIds.split(",") : [];
  if (
    rawIds.length > 1600 ||
    requestedIds.length > 12 ||
    requestedIds.some((id) => !/^[\w-]{1,128}$/.test(id))
  ) {
    return fail("The recently viewed product list is invalid");
  }

  const ids = [...new Set(requestedIds)];
  if (ids.length === 0) return ok({ products: [] });

  const byId = new Map(activeProductsByIds(ids).map((product) => [product.id, product]));
  return ok({ products: ids.map((id) => byId.get(id)).filter((product) => product !== undefined) });
}
