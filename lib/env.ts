/**
 * Runtime configuration.
 *
 * The app is zero-config by design (embedded SQLite, no API keys), which means
 * the signing key for session cookies has to come from *somewhere* on a fresh
 * deploy. Order of precedence:
 *
 *   1. `AUTH_SECRET` environment variable (required in production).
 *   2. A `data/.auth-secret` file created on first development boot (0600) so
 *      local sessions survive restarts without shipping a well-known secret.
 *   3. In development only: a fixed local secret, with a loud warning.
 *
 * Production requires an explicitly configured secret before build or boot;
 * this prevents a build-time generated key from being baked into an image.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEV_FALLBACK_SECRET = "softdealz-development-secret-please-change-in-production";
const MIN_SECRET_LENGTH = 32;

export const isProduction = process.env.NODE_ENV === "production";

function databasePath(): string {
  return process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "softdealz.db");
}

function secretFilePath(): string {
  return (
    process.env.AUTH_SECRET_FILE ?? path.join(path.dirname(databasePath()), ".auth-secret")
  );
}

let cached: Uint8Array | null = null;
let warned = false;

function warn(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[softdealz] ${message}`);
}

/** Read (or create) the persisted fallback secret. Returns null when unwritable. */
function persistedSecret(): string | null {
  const file = secretFilePath();
  try {
    const existing = fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8").trim();
    if (existing.length < MIN_SECRET_LENGTH) {
      throw new Error(`The signing key at ${file} is shorter than ${MIN_SECRET_LENGTH} characters.`);
    }
    return existing;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const generated = randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    fs.writeFileSync(file, generated, { mode: 0o600, flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return persistedSecret();
    throw error;
  }
  warn(
    `AUTH_SECRET is not set — generated a local signing key at ${path.relative(
      process.cwd(),
      file,
    )}. Set AUTH_SECRET in the environment for production deployments.`,
  );
  return generated;
}

/**
 * The HMAC key used to sign session tokens. Cached for the process lifetime.
 * Throws in production when no secret can be established, so a misconfigured
 * deployment cannot boot with a guessable signing key.
 */
export function authSecret(): Uint8Array {
  if (cached) return cached;

  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) {
    if (fromEnv.length < MIN_SECRET_LENGTH) {
      const message = `AUTH_SECRET is shorter than ${MIN_SECRET_LENGTH} characters. Use a long random string (e.g. \`openssl rand -hex 32\`).`;
      if (isProduction) throw new Error(message);
      warn(message);
    }
    cached = new TextEncoder().encode(fromEnv);
    return cached;
  }

  if (isProduction) {
    throw new Error(
      "AUTH_SECRET is required in production: set a strong random secret before building and starting the app.",
    );
  }

  const persisted = persistedSecret();
  if (persisted) {
    cached = new TextEncoder().encode(persisted);
    return cached;
  }

  warn(
    "AUTH_SECRET is not set and no signing key could be persisted — using the development fallback. Never use this in production.",
  );
  cached = new TextEncoder().encode(DEV_FALLBACK_SECRET);
  return cached;
}

let warnedSiteUrl = false;

/**
 * Normalise a configured site URL into an absolute http(s) URL.
 *
 * `app/layout.tsx` feeds this straight into `new URL()` at module load, so a
 * typo such as `NEXT_PUBLIC_SITE_URL=softdealz.lk` (no scheme) or a stray space
 * used to throw during render and take down *every* page over metadata that
 * only affects social previews. Anything unusable now falls back with a warning.
 */
function absoluteSiteUrl(value: string): string | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** Public site URL, used for canonical links, OG images and sitemaps. */
export function siteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;

    const normalised = absoluteSiteUrl(value);
    if (normalised) return normalised;

    if (!warnedSiteUrl) {
      warnedSiteUrl = true;
      console.warn(
        `[softdealz] NEXT_PUBLIC_SITE_URL is not a usable absolute URL ("${value}"). ` +
          "Falling back to http://localhost:3000 — set it to e.g. https://softdealz.lk so social previews and sitemaps are correct.",
      );
    }
  }

  return "http://localhost:3000";
}

/** Display currency used when a record does not carry its own. */
export function defaultCurrency(): string {
  return process.env.NEXT_PUBLIC_CURRENCY?.trim() || "LKR";
}
