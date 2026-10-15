import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { toggleWishlist, wishlistIds } from "@/lib/data/account";
import { fail, ok, readJson, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().trim().min(1, "A product is required").max(64),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({ ids: wishlistIds(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "A product is required");
  }

  // `toggleWishlist` verifies the product exists, so an unknown id can never
  // reach the foreign key constraint (which used to surface as a 500).
  const result = toggleWishlist(user.id, parsed.data.productId);
  if (!result.ok) return fail(result.error ?? "That product is not available", 404);

  return ok({ added: result.added, ids: wishlistIds(user.id) });
}
