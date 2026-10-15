import * as React from "react";
import { cn, statusTone, titleCase } from "@/lib/utils";

type Tone = "brand" | "ocean" | "amber" | "rose" | "neutral" | "dark";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ocean: "bg-ocean-50 text-ocean-700 ring-ocean-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-500/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-500/25",
  neutral: "bg-ink-100 text-ink-700 ring-ink-400/20",
  dark: "bg-ink-900 text-white ring-white/10",
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "px-2 py-0.5 text-[0.68rem]",
    md: "px-2.5 py-1 text-[0.72rem]",
    lg: "px-3 py-1.5 text-[0.8rem]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset",
        TONES[tone],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Status pill — maps a domain status string to a tone automatically. */
export function StatusPill({
  status,
  className,
  showDot = true,
}: {
  status: string;
  className?: string;
  showDot?: boolean;
}) {
  const tone = statusTone(status);
  const dotColor: Record<string, string> = {
    brand: "bg-brand-600",
    ocean: "bg-ocean-600",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    neutral: "bg-ink-400",
  };
  return (
    <Badge tone={tone} className={className}>
      {showDot && <span className={cn("size-1.5 rounded-full", dotColor[tone])} aria-hidden />}
      {titleCase(status)}
    </Badge>
  );
}

export function StockBadge({ stock, lowStockAlert = 5 }: { stock: number; lowStockAlert?: number }) {
  if (stock <= 0) {
    return <Badge tone="rose">Out of stock</Badge>;
  }
  if (stock <= lowStockAlert) {
    return <Badge tone="amber">Only {stock} left</Badge>;
  }
  return (
    <Badge tone="brand" className="normal-case tracking-normal">
      In stock
    </Badge>
  );
}

export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-rose-brand px-2.5 py-1 text-[0.7rem] font-extrabold text-white shadow-sm",
        className,
      )}
    >
      −{percent}%
    </span>
  );
}

/** Small count bubble, e.g. cart items or unread notifications. */
export function CountBubble({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 grid min-w-[1.15rem] place-items-center rounded-full bg-rose-brand px-1 text-[0.65rem] font-bold leading-[1.15rem] text-white ring-2 ring-white",
        className,
      )}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
