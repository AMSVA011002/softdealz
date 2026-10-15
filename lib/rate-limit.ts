/**
 * Lightweight in-process rate limiter.
 *
 * The app runs as a single Node process with an embedded database, so a small
 * fixed-window limiter kept in memory is enough to stop credential stuffing,
 * newsletter spam and order-number enumeration. If the app is ever scaled to
 * multiple instances, swap the store for Redis — the call signature stays the
 * same.
 */
import { headers } from "next/headers";
import { isIP } from "node:net";

interface Hit {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Hit>();
const MAX_TRACKED_KEYS = 5_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function sweep(now: number) {
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Count one attempt against `key`. Window is fixed (simplest to reason about),
 * counters are reset lazily and expired keys are swept on write.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Prefer proxy-overwritten client IP headers; use the rightmost forwarded address as fallback. */
export function clientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  const candidates = [
    headerList.get("x-real-ip"),
    headerList.get("cf-connecting-ip"),
    headerList.get("x-vercel-forwarded-for"),
    forwarded?.split(",").at(-1),
  ];
  return candidates.map((value) => value?.trim()).find((value) => value && isIP(value)) ?? "unknown";
}

/** Same as `clientIpFromHeaders`, for route handlers. */
export function clientIp(request: Request): string {
  return clientIpFromHeaders(request.headers);
}

/** Convenience wrapper for server actions. */
export async function rateLimitFromRequest(
  action: string,
  limit: number,
  windowMs: number,
  discriminator = "",
): Promise<RateLimitResult> {
  const headerList = await headers();
  const key = `${action}:${clientIpFromHeaders(headerList)}:${discriminator.toLowerCase()}`;
  return rateLimit(key, limit, windowMs);
}

export const RATE_LIMITS = {
  /** Sign-in attempts per IP+email. */
  login: { limit: 8, windowSeconds: 60 },
  /** New accounts per IP per hour. */
  register: { limit: 10, windowSeconds: 60 * 60 },
  /** Newsletter sign-ups per IP per hour. */
  newsletter: { limit: 8, windowSeconds: 60 * 60 },
  /** Contact form submissions per IP per hour. */
  contact: { limit: 6, windowSeconds: 60 * 60 },
  /** Authenticated order tracking lookups per IP and account per minute. */
  track: { limit: 12, windowSeconds: 60 },
  /** Reviews per shopper per hour. */
  review: { limit: 12, windowSeconds: 60 * 60 },
  /** Coupon probes per IP per minute. */
  coupon: { limit: 30, windowSeconds: 60 },
} as const;
