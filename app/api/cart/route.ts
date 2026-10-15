import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  MAX_LINE_QUANTITY,
  addToCart,
  getCart,
  getCartCount,
  removeFromCart,
  setCartQuantity,
} from "@/lib/data/cart";
import { fail, ok, readJson, unauthorized } from "@/lib/api";
import { getProductById } from "@/lib/data/products";

export const dynamic = "force-dynamic";

/**
 * Accepts JSON numbers or digit-only strings. Deliberately narrower than
 * `z.coerce.number()` — coercion would happily turn `[]`, `""` and `null`
 * into `0` and let nonsensical payloads through to the data layer.
 */
const quantitySchema = z
  .union([z.number(), z.string()], { error: "Quantity must be a number" })
  .superRefine((value, ctx) => {
    const numeric =
      typeof value === "number" ? value : /^[+-]?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;

    if (!Number.isFinite(numeric)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantity must be a number" });
      return;
    }
    if (!Number.isInteger(numeric)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantity must be a whole number" });
      return;
    }
    if (numeric < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantity cannot be negative" });
      return;
    }
    if (numeric > MAX_LINE_QUANTITY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You can order at most ${MAX_LINE_QUANTITY} of one item`,
      });
    }
  })
  .transform((value) => (typeof value === "number" ? value : Number(value)));

const mutationSchema = z.object({
  productId: z.string().trim().min(1, "A product is required").max(64),
  quantity: quantitySchema.optional(),
});

function parseBody(raw: Record<string, unknown> | null) {
  if (!raw) return { ok: false as const, response: fail("Send a JSON body with a productId") };
  const parsed = mutationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, response: fail(parsed.error.issues[0]?.message ?? "Invalid request") };
  }
  return { ok: true as const, data: parsed.data };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({ items: getCart(user.id), count: getCartCount(user.id) });
}

/** Adds `quantity` (default 1) of a product, respecting stock on hand. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = parseBody(await readJson<Record<string, unknown>>(request));
  if (!body.ok) return body.response;

  const { productId, quantity } = body.data;

  const product = getProductById(productId);
  if (!product) return fail("That product no longer exists", 404);
  if (product.status !== "ACTIVE") return fail("That product is not available right now");
  if (product.stock <= 0) return fail("That product is out of stock");

  const result = addToCart(user.id, product.id, quantity ?? 1);
  if (!result.ok) return fail(result.error ?? "Could not add that item", 409);

  return ok({ count: getCartCount(user.id), quantity: result.quantity });
}

/** Sets an absolute quantity for a line. `0` removes the line. */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = parseBody(await readJson<Record<string, unknown>>(request));
  if (!body.ok) return body.response;

  const { productId, quantity } = body.data;
  if (quantity === undefined) return fail("A quantity is required");

  const result = setCartQuantity(user.id, productId, quantity);
  if (!result.ok) return fail(result.error ?? "Could not update that item", 409);

  return ok({ count: getCartCount(user.id), quantity: result.quantity });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const productId = request.nextUrl.searchParams.get("productId")?.trim();
  if (!productId) return fail("A product is required");

  removeFromCart(user.id, productId);
  return ok({ count: getCartCount(user.id) });
}
