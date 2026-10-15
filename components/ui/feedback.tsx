import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, PackageOpen, Star, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT_STYLES: Record<AlertTone, { wrapper: string; icon: React.ReactNode }> = {
  info: {
    wrapper: "bg-ocean-50 text-ocean-800 border-ocean-200",
    icon: <Info className="size-5 shrink-0 text-ocean-600" aria-hidden />,
  },
  success: {
    wrapper: "bg-brand-50 text-brand-800 border-brand-200",
    icon: <CheckCircle2 className="size-5 shrink-0 text-brand-600" aria-hidden />,
  },
  warning: {
    wrapper: "bg-amber-50 text-amber-900 border-amber-200",
    icon: <AlertTriangle className="size-5 shrink-0 text-amber-600" aria-hidden />,
  },
  danger: {
    wrapper: "bg-rose-50 text-rose-800 border-rose-200",
    icon: <XCircle className="size-5 shrink-0 text-rose-600" aria-hidden />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const styles = ALERT_STYLES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border p-3.5 text-[0.85rem]", styles.wrapper, className)}
    >
      {styles.icon}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("leading-relaxed", title && "mt-0.5 opacity-90")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-soft">
        {icon ?? <PackageOpen className="size-6" aria-hidden />}
      </div>
      <h3 className="text-fluid-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[0.85rem] text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rating                                                              */
/* ------------------------------------------------------------------ */

export function Rating({
  value,
  count,
  size = "md",
  className,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}) {
  const starSize = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const half = !filled && rounded >= star - 0.5;
          return (
            <span key={star} className="relative inline-flex">
              <Star className={cn(starSize, "text-ink-300")} strokeWidth={1.8} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star className={cn(starSize, "fill-amber-400 text-amber-400")} strokeWidth={0} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className={cn("font-semibold text-ink-700", size === "sm" ? "text-[0.72rem]" : "text-[0.8rem]")}>
          {value.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className={cn("text-ink-400", size === "sm" ? "text-[0.7rem]" : "text-[0.78rem]")}>
          ({count.toLocaleString()})
        </span>
      )}
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
    </div>
  );
}

/** Star picker used in the review form. */
export function RatingInput({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "md" | "lg";
}) {
  const starSize = size === "lg" ? "size-7" : "size-6";
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-ring"
        >
          <Star
            className={cn(
              starSize,
              star <= value ? "fill-amber-400 text-amber-400" : "text-ink-300 hover:text-amber-300",
            )}
            strokeWidth={star <= value ? 0 : 1.8}
          />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={cn("h-10 flex-1", colIndex === 0 && "flex-[2]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-7",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-fluid-2xl font-extrabold">{title}</h2>
        {description && <p className="mt-1.5 text-[0.88rem] text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
