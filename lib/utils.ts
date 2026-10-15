import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build a query string, dropping empty values. */
export function buildQuery(params: Record<string, string | number | boolean | string[] | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, String(entry)));
    } else {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Percentage change between two numbers, guarded against divide-by-zero. */
export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safe JSON parse for values arriving from the client. */
export function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const ORDER_STATUS_TONE: Record<string, "brand" | "ocean" | "amber" | "rose" | "neutral"> = {
  PENDING: "amber",
  CONFIRMED: "ocean",
  PROCESSING: "ocean",
  SHIPPED: "ocean",
  DELIVERED: "brand",
  CANCELLED: "rose",
  REFUNDED: "neutral",
  PAID: "brand",
  UNPAID: "amber",
  FAILED: "rose",
  ACTIVE: "brand",
  DRAFT: "neutral",
  ARCHIVED: "neutral",
  APPROVED: "brand",
  REJECTED: "rose",
  SUSPENDED: "rose",
  ADMIN: "brand",
  VENDOR: "ocean",
  CUSTOMER: "neutral",
};

export function statusTone(status: string) {
  return ORDER_STATUS_TONE[status] ?? "neutral";
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
