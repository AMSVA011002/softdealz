"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { placeOrder } from "@/lib/data/orders";
import { createReview, hasReviewed } from "@/lib/data/reviews";
import { getProductBySlug } from "@/lib/data/products";
import { markAllRead, markRead, pushNotification } from "@/lib/data/account";
import { getCart, validateCoupon } from "@/lib/data/cart";
import { safeRedirectPath } from "@/lib/params";
import { RATE_LIMITS, rateLimitFromRequest } from "@/lib/rate-limit";
import type { PaymentMethod } from "@/lib/types";

export interface CheckoutState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const addressSchema = z.object({
  fullName: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().min(9, "Enter a valid phone number"),
  line1: z.string().min(4, "Enter the street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter the city"),
  state: z.string().min(2, "Enter the province"),
  postalCode: z.string().min(3, "Enter the postal code"),
  country: z.string().default("Sri Lanka"),
  note: z.string().optional(),
});

/**
 * Places the order from the shopper's cart. Payment is simulated — a real
 * gateway would slot in here, before the order row is written.
 */
export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const rawMethod = String(formData.get("paymentMethod") ?? "COD").trim().toUpperCase();
  const paymentMethod: PaymentMethod = (["COD", "CARD", "WALLET"] as const).includes(
    rawMethod as PaymentMethod,
  )
    ? (rawMethod as PaymentMethod)
    : "COD";

  const couponCode = String(formData.get("couponCode") ?? "").trim().slice(0, 40) || null;

  const limit = await rateLimitFromRequest(
    "checkout",
    RATE_LIMITS.contact.limit,
    RATE_LIMITS.contact.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return { error: `Too many checkout attempts. Please wait ${limit.retryAfterSeconds} seconds.` };
  }

  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "Sri Lanka",
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      fieldErrors[String(issue.path[0])] = issue.message;
    });
    return { fieldErrors, error: "Please review the highlighted fields" };
  }

  // Card payments are simulated: a real integration would authorise here and
  // only continue when the gateway returns success.
  if (paymentMethod === "CARD" || paymentMethod === "WALLET") {
    const cardNumber = String(formData.get("cardNumber") ?? "").replace(/\s+/g, "");
    if (cardNumber.length < 12) {
      return { fieldErrors: { cardNumber: "Enter a valid card number" }, error: "Payment details incomplete" };
    }
  }

  if (couponCode) {
    // Validate before writing the order so an invalid code is never persisted
    // (or counted against the coupon's usage limit).
    const lines = getCart(user.id);
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const coupon = validateCoupon(couponCode, subtotal);
    if (!coupon.valid) {
      return { fieldErrors: { couponCode: coupon.error ?? "That coupon is not valid" }, error: "Please check the coupon code" };
    }
  }

  const result = placeOrder({
    userId: user.id,
    email: user.email,
    customerName: parsed.data.fullName,
    phone: parsed.data.phone,
    shippingAddress: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 ?? "",
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
    },
    paymentMethod,
    couponCode,
    note: parsed.data.note ?? null,
  });

  if (!result.ok || !result.order) {
    return { error: result.error ?? "We could not place your order. Please try again." };
  }

  revalidatePath("/account/orders");
  revalidatePath("/admin/orders");
  redirect(safeRedirectPath(`/checkout/success/${result.order.orderNumber}`, "/account/orders"));
}

export interface ReviewState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to write a review" };

  const limit = await rateLimitFromRequest(
    "review",
    RATE_LIMITS.review.limit,
    RATE_LIMITS.review.windowSeconds * 1000,
    user.id,
  );
  if (!limit.ok) {
    return { error: `You have posted a lot of reviews recently. Try again in ${limit.retryAfterSeconds} seconds.` };
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const product = getProductBySlug(slug);
  if (!product) return { error: "That product could not be found" };

  const rating = Math.trunc(Number(formData.get("rating") ?? 5));
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);

  if (body.length < 10) return { fieldErrors: { body: "Tell us a little more — at least 10 characters" } };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { fieldErrors: { rating: "Choose a rating from 1 to 5 stars" } };
  }
  if (hasReviewed(user.id, product.id)) {
    return { error: "You have already reviewed this product" };
  }

  createReview({
    productId: product.id,
    userId: user.id,
    authorName: user.name,
    rating,
    title: title || null,
    body,
    // Verified shoppers publish immediately; everything is still visible to moderators.
    status: "APPROVED",
  });

  revalidatePath(`/product/${slug}`);
  revalidatePath("/admin/reviews");
  return { success: "Thanks! Your review is live." };
}

export async function markNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return;
  markAllRead(user.id);
  revalidatePath("/account/notifications");
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  if (typeof id !== "string" || !id.trim()) return;
  markRead(user.id, id);
  revalidatePath("/account/notifications");
  revalidatePath("/", "layout");
}

/** Simple contact form: stores a notification for the store admins. */
export async function contactAction(_prev: { status?: string; error?: string }, formData: FormData) {
  const limit = await rateLimitFromRequest(
    "contact",
    RATE_LIMITS.contact.limit,
    RATE_LIMITS.contact.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return { error: `You have sent several messages already. Try again in ${limit.retryAfterSeconds} seconds.` };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const subject = String(formData.get("subject") ?? "General enquiry").trim().slice(0, 120);
  const message = String(formData.get("message") ?? "").trim().slice(0, 4000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return { error: "Please complete every field so we can help you properly." };
  }

  const { all } = await import("@/lib/db");
  const admins = all<{ id: string }>("SELECT id FROM users WHERE role = 'ADMIN'");
  admins.forEach((admin) => {
    pushNotification(
      admin.id,
      `Contact form: ${subject}`,
      `${name} (${email}) wrote: ${message.slice(0, 220)}`,
      "INFO",
    );
  });

  return { status: `Thanks ${name.split(" ")[0]} — we'll reply to ${email} within one business day.` };
}
