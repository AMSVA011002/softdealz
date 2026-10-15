import { NextRequest } from "next/server";
import { z } from "zod";
import { subscribeNewsletter } from "@/lib/data/account";
import { fail, ok, readJson } from "@/lib/api";
import { RATE_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().min(3, "Enter your email address").max(254).email("Enter a valid email address"),
});

export async function POST(request: NextRequest) {
  // Cheap abuse guard: sign-ups are unauthenticated, so a script could otherwise
  // flood the table (and any future ESP integration).
  const limit = rateLimit(
    `newsletter:${clientIp(request)}`,
    RATE_LIMITS.newsletter.limit,
    RATE_LIMITS.newsletter.windowSeconds * 1000,
  );
  if (!limit.ok) {
    return fail(`Too many sign-ups from this network. Try again in ${limit.retryAfterSeconds}s.`, 429);
  }

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Enter a valid email address");
  }

  const result = subscribeNewsletter(parsed.data.email);
  if (!result.ok) return fail(result.error ?? "Could not subscribe right now");

  return ok({ message: "You're on the list. Deals land in your inbox every Friday." });
}
