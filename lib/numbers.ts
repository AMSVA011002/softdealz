/**
 * Numeric coercion helpers shared by the data layer.
 *
 * SQLite (through `node:sqlite`) rejects `NaN`, `Infinity` and non-numeric
 * strings bound to a parameter with `datatype mismatch`. Anything that can
 * reach a `LIMIT`/`OFFSET`/`WHERE` clause therefore goes through these first.
 */

/** Clamp any value into a whole number inside `[min, max]`, falling back when unusable. */
export function safeInt(
  value: unknown,
  fallback: number,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/** Clamp a value into a finite float inside `[min, max]`, or `undefined`. */
export function safeFloat(value: unknown, min: number, max: number): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, parsed));
}

/** Round to two decimals (money-safe for LKR-style currency totals). */
export function round2(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}
