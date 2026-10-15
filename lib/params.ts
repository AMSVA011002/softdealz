/**
 * Query-parameter and redirect sanitising helpers.
 *
 * Every value that arrives from the browser (URL search params, form fields,
 * `?next=` links) is untrusted. These helpers coerce those values into the
 * exact shape the data layer expects so a malformed request can never reach
 * SQLite — binding `NaN` or `"abc"` into `LIMIT`/`OFFSET` used to surface as a
 * `datatype mismatch` 500 from the database driver.
 */

export type ParamValue = string | string[] | undefined;

/** First value of a possibly repeated query parameter. */
export function firstParam(value: ParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Parse an integer query parameter, clamped to `[min, max]`.
 * Falls back to `fallback` for missing, empty, non-numeric or out-of-range input.
 */
export function intParam(
  value: ParamValue,
  fallback: number,
  options: { min?: number; max?: number } = {},
): number {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  const raw = firstParam(value);
  if (raw === undefined || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;

  const whole = Math.trunc(parsed);
  return Math.min(max, Math.max(min, whole));
}

/**
 * Parse a decimal query parameter. Returns `undefined` when the value is
 * missing or not a finite number, so callers can simply skip the filter.
 */
export function numberParam(
  value: ParamValue,
  options: { min?: number; max?: number } = {},
): number | undefined {
  const { min = -Number.MAX_VALUE, max = Number.MAX_VALUE } = options;
  const raw = firstParam(value);
  if (raw === undefined || raw.trim() === "") return undefined;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;

  return Math.min(max, Math.max(min, parsed));
}

/** Comma-or-repeat separated list parameter, e.g. `?brand=acme,zenith`. */
export function listParam(value: ParamValue): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Only allow same-site, absolute paths to be used as redirect targets.
 * Rejects protocol-relative (`//evil.com`), backslash (`/\evil.com`) and
 * absolute (`https://evil.com`) values that browsers treat as cross-origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  if (candidate.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback;

  return candidate;
}

/**
 * Coerce anything a form or JSON body might contain into a finite number.
 * Returns `undefined` when the value cannot be represented safely.
 */
export function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Non-empty trimmed string, or `undefined`. */
export function safeString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}
