/** Presentation helpers shared by server and client components. */

const CURRENCY_LOCALE = "en-LK";

export function formatPrice(value: number, currency = "LKR"): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

/** Compact form for dense admin tables and dashboards: LKR 1.2M */
export function formatCompactPrice(value: number, currency = "LKR"): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (Math.abs(amount) >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  return `${currency} ${amount.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value.replace(" ", "T")) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value.replace(" ", "T")) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value.replace(" ", "T")) : value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "—";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, length = 120): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}

/** Splits a product title into display lines for the generated artwork. */
export function titleToLines(title: string, maxChars = 18, maxLines = 3): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = `${current} ${word}`.trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

export function discountLabel(percent?: number): string | null {
  if (!percent || percent <= 0) return null;
  return `-${percent}%`;
}
