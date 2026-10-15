import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/data/orders";
import { ok } from "@/lib/api";
import { RATE_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * Order tracking is restricted to the authenticated order owner (or an admin).
 * Order numbers are identifiers, not credentials, and are not sufficient to
 * retrieve private order information.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to track your order" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limits = [
    rateLimit(
      `track:ip:${clientIp(request)}`,
      RATE_LIMITS.track.limit,
      RATE_LIMITS.track.windowSeconds * 1000,
    ),
    rateLimit(
      `track:user:${user.id}`,
      RATE_LIMITS.track.limit,
      RATE_LIMITS.track.windowSeconds * 1000,
    ),
  ];
  const blockedLimit = limits.find((limit) => !limit.ok);
  if (blockedLimit) {
    return NextResponse.json(
      { ok: false, error: `Too many lookups. Try again in ${blockedLimit.retryAfterSeconds}s.` },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const orderNumber = request.nextUrl.searchParams.get("order")?.trim();
  if (!orderNumber || !/^SD-\d{8}-\d{4}$/.test(orderNumber)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid order number" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const order = getOrderByNumber(orderNumber);
  if (!order || (user.role !== "ADMIN" && order.userId !== user.id)) {
    return NextResponse.json(
      { ok: false, error: "We could not find that order" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  return ok({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      placedAt: order.placedAt,
      total: order.total,
      currency: order.currency,
      customerName: order.customerName,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map((item) => ({
        title: item.title,
        slug: item.slug,
        image: item.image,
        quantity: item.quantity,
        total: item.total,
      })),
      timeline: order.timeline,
      shippingAddress: order.shippingAddress,
    },
  }, { headers: NO_STORE_HEADERS });
}
