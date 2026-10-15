#!/usr/bin/env node
/**
 * SoftDealz smoke test.
 *
 * Exercises the running app over HTTP the way a browser (and an attacker)
 * would, including regression checks for the bugs that shipped in the first
 * cut: NaN pagination 500s, malformed JSON bodies, unknown wishlist ids,
 * non-numeric cart quantities and dead footer links.
 *
 *   npm run build && npm start        # in one shell
 *   npm run smoke                     # in another
 *
 * Expects a seeded database (npm run db:setup or SEED_FORCE=1 npm run db:seed).
 * It signs in as the seeded demo customer + administrator, which requires the
 * same AUTH_SECRET (or generated data/.auth-secret) the server boots with.
 */
import fs from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";
import { DatabaseSync } from "node:sqlite";

const BASE = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const DB_PATH = process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "softdealz.db");
const SECRET_FILE = process.env.AUTH_SECRET_FILE ?? path.join(path.dirname(DB_PATH), ".auth-secret");

const results = [];
let failures = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures += 1;
  const label = ok ? "PASS" : "FAIL";
  console.log(`${label}  ${name}${detail && !ok ? `  → ${detail}` : ""}`);
}

function resolveSecret() {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  try {
    const persisted = fs.readFileSync(SECRET_FILE, "utf8").trim();
    if (persisted) return persisted;
  } catch {
    /* no persisted secret yet */
  }
  throw new Error(
    "No AUTH_SECRET found. Set AUTH_SECRET, or start the server once so it can generate data/.auth-secret.",
  );
}

async function mintToken(userId) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3600s")
    .sign(new TextEncoder().encode(resolveSecret()));
}

function findUserId(email) {
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  try {
    const row = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    return row?.id ?? null;
  } finally {
    db.close();
  }
}

async function request(pathname, { method = "GET", token, body, headers = {} } = {}) {
  const response = await fetch(`${BASE}${pathname}`, {
    method,
    redirect: "manual",
    headers: {
      ...(token ? { cookie: `softdealz_session=${token}` } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON — fine for HTML pages */
  }
  return {
    status: response.status,
    location: response.headers.get("location"),
    headers: response.headers,
    text,
    json,
  };
}

async function expectStatus(name, pathname, expected, options) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  try {
    const result = await request(pathname, options);
    record(name, allowed.includes(result.status), `expected ${allowed.join("/")}, got ${result.status}`);
    return result;
  } catch (error) {
    record(name, false, error.message);
    return { status: 0, text: "", json: null };
  }
}

async function main() {
  console.log(`\nSoftDealz smoke test → ${BASE}\n`);

  /* ---------------- public pages ---------------- */
  const home = await expectStatus("homepage renders", "/", 200);
  record("homepage contains brand", home.text.includes("SoftDealz"), "brand missing from HTML");
  const csp = home.headers.get("content-security-policy") ?? "";
  record(
    "production CSP uses a nonce and blocks framing",
    /script-src[^;]*'nonce-[^']+'/.test(csp) && csp.includes("frame-ancestors 'none'"),
    csp || "Content-Security-Policy missing",
  );
  record(
    "security headers are present",
    home.headers.get("x-content-type-options") === "nosniff" &&
      home.headers.get("strict-transport-security")?.includes("max-age="),
    "Expected nosniff and HSTS response headers",
  );

  await expectStatus("catalogue renders", "/products", 200);
  await expectStatus("deals page renders", "/deals", 200);
  await expectStatus("brands page renders", "/brands", 200);
  await expectStatus("help page renders", "/help", 200);
  await expectStatus("contact page renders", "/contact", 200);
  await expectStatus("tracking page renders", "/track", 200);
  await expectStatus("login page renders", "/login", 200);

  // Regression: these footer targets used to 404 on every page.
  for (const pathname of ["/about", "/terms", "/privacy", "/shipping", "/returns"]) {
    await expectStatus(`policy page ${pathname}`, pathname, 200);
  }

  await expectStatus("robots.txt", "/robots.txt", 200);
  await expectStatus("sitemap.xml", "/sitemap.xml", 200);

  /* ---------------- malformed query parameters ---------------- */
  // Regression: `?page=abc` bound NaN into SQLite and returned a 500.
  await expectStatus("products ignores ?page=abc", "/products?page=abc", 200);
  await expectStatus("products ignores ?perPage=abc", "/products?perPage=abc", 200);
  await expectStatus("products ignores ?page=Infinity", "/products?page=Infinity", 200);
  await expectStatus("products ignores junk price filters", "/products?minPrice=abc&maxPrice=xyz&rating=nope", 200);
  await expectStatus("deals ignores ?page=abc", "/deals?page=abc", 200);
  await expectStatus("search ignores ?page=abc", "/search?q=phone&page=abc", 200);
  await expectStatus("category ignores ?page=abc", "/category/electronics?page=abc", 200);
  await expectStatus("unknown category 404s", "/category/not-a-real-category", 404);

  /* ---------------- unauthenticated API behaviour ---------------- */
  await expectStatus("cart API requires auth", "/api/cart", 401);
  await expectStatus("wishlist API requires auth", "/api/wishlist", 401);
  await expectStatus("coupon API requires auth", "/api/coupon", [401], { method: "POST", body: { code: "WELCOME10" } });
  await expectStatus("tracking API validates input", "/api/track", 400);

  // Regression: a non-string email threw `email.trim is not a function`.
  const badEmail = await expectStatus("newsletter rejects non-string email", "/api/newsletter", 400, {
    method: "POST",
    body: { email: 12345 },
  });
  record("newsletter error is JSON", Boolean(badEmail.json?.error), JSON.stringify(badEmail.json));
  await expectStatus("newsletter rejects invalid email", "/api/newsletter", 400, {
    method: "POST",
    body: { email: "not-an-email" },
  });

  /* ---------------- authenticated flows ---------------- */
  const customerId = findUserId("customer@softdealz.lk");
  const adminId = findUserId("admin@softdealz.lk");
  if (!customerId || !adminId) {
    record("demo accounts exist", false, "run `npm run db:seed:force` first");
    return finish();
  }

  const customerToken = await mintToken(customerId);
  const adminToken = await mintToken(adminId);

  await expectStatus("anonymous account area redirects", "/account", 307);
  await expectStatus("anonymous checkout redirects", "/checkout", 307);
  await expectStatus("customer dashboard renders", "/account", 200, { token: customerToken });
  await expectStatus("customer cart renders", "/cart", 200, { token: customerToken });
  await expectStatus("customer orders render", "/account/orders", 200, { token: customerToken });
  await expectStatus("customer cannot open admin", "/admin", 307, { token: customerToken });
  await expectStatus("admin dashboard renders", "/admin", 200, { token: adminToken });
  await expectStatus("admin orders render", "/admin/orders", 200, { token: adminToken });
  await expectStatus("admin orders ignore ?page=1e30", "/admin/orders?page=1e30", 200, { token: adminToken });
  await expectStatus("admin products ignore ?page=Infinity", "/admin/products?page=Infinity", 200, { token: adminToken });
  await expectStatus("admin customers ignore ?page=abc", "/admin/customers?page=abc", 200, { token: adminToken });
  await expectStatus("admin reviews render", "/admin/reviews", 200, { token: adminToken });
  await expectStatus("admin inventory renders", "/admin/inventory", 200, { token: adminToken });
  await expectStatus("admin analytics renders", "/admin/analytics", 200, { token: adminToken });

  const suggestions = await expectStatus("search typeahead works", "/api/search?q=phone", 200);
  const productId = suggestions.json?.products?.[0]?.id;
  record("typeahead returns products", Boolean(productId), JSON.stringify(suggestions.json));

  if (productId) {
    // Regression: a non-numeric quantity wrote NULL and blew up as a 500.
    const badQuantity = await expectStatus("cart rejects non-numeric quantity", "/api/cart", 400, {
      method: "POST",
      token: customerToken,
      body: { productId, quantity: "abc" },
    });
    record("quantity error is JSON", Boolean(badQuantity.json?.error), JSON.stringify(badQuantity.json));

    await expectStatus("cart rejects unknown product", "/api/cart", 404, {
      method: "POST",
      token: customerToken,
      body: { productId: "prd_does_not_exist", quantity: 1 },
    });

    const added = await expectStatus("cart accepts a valid item", "/api/cart", 200, {
      method: "POST",
      token: customerToken,
      body: { productId, quantity: 1 },
    });
    record("cart returns a count", typeof added.json?.count === "number", JSON.stringify(added.json));

    // Over-stock and out-of-range quantities are both rejected (409 from the
    // stock check, 400 from the per-line ceiling).
    await expectStatus("cart rejects over-stock quantity", "/api/cart", [400, 409], {
      method: "PATCH",
      token: customerToken,
      body: { productId, quantity: 9999 },
    });

    // Clean up so repeat runs start from the same state (DELETE uses a query param).
    await expectStatus(
      "cart cleanup",
      `/api/cart?productId=${encodeURIComponent(productId)}`,
      200,
      { method: "DELETE", token: customerToken },
    );
  }

  // Regression: an unknown wishlist id tripped the foreign key (500).
  await expectStatus("wishlist rejects unknown product", "/api/wishlist", 404, {
    method: "POST",
    token: customerToken,
    body: { productId: "prd_does_not_exist" },
  });

  if (productId) {
    const toggled = await request("/api/wishlist", {
      method: "POST",
      token: customerToken,
      body: { productId },
    });
    record("wishlist toggles a real product", toggled.status === 200, `got ${toggled.status}`);
    // Toggle back so repeat runs stay idempotent.
    await request("/api/wishlist", { method: "POST", token: customerToken, body: { productId } });
  }

  return finish();
}

function finish() {
  const total = results.length;
  const passed = total - failures;
  console.log(`\n${passed}/${total} checks passed${failures ? ` — ${failures} FAILED` : ""}\n`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error("\nSmoke test crashed:", error);
  process.exit(1);
});
