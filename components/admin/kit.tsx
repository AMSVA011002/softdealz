import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "brand",
  sparkline,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "ocean" | "amber" | "rose";
  sparkline?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    ocean: "bg-ocean-50 text-ocean-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const positive = (delta ?? 0) > 0.5;
  const negative = (delta ?? 0) < -0.5;

  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-1.5 text-fluid-2xl font-extrabold leading-none text-ink-900">{value}</p>
        </div>
        {icon && (
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>{icon}</span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {typeof delta === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-bold",
                positive
                  ? "bg-brand-50 text-brand-700"
                  : negative
                    ? "bg-rose-50 text-rose-700"
                    : "bg-ink-100 text-ink-600",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3.5" />
              ) : negative ? (
                <ArrowDownRight className="size-3.5" />
              ) : (
                <Minus className="size-3.5" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <p className="mt-1 text-[0.72rem] text-ink-500">{hint}</p>}
        </div>
        {sparkline}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function AdminPageHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-6">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ink-400">
              {breadcrumb.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-brand-700">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {index < breadcrumb.length - 1 && <span>/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-fluid-2xl font-extrabold">{title}</h1>
        {description && <p className="mt-1 text-[0.85rem] text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("card-surface overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-bold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[0.78rem] text-ink-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(padded ? "p-4 sm:p-5" : "", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Data table — table on desktop, stacked cards on phones              */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  header: string;
  /** Rendered on desktop. */
  cell: (row: T) => React.ReactNode;
  /** Rendered on phones. Falls back to `cell`. */
  mobileCell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const HIDE_CLASSES: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  emptyMessage = "Nothing to show yet",
  caption,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  emptyMessage?: string;
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-6 py-12 text-center">
        <p className="text-[0.88rem] font-semibold text-ink-800">{emptyMessage}</p>
        <p className="mt-1 text-[0.8rem] text-ink-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-ink-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-[0.72rem] font-bold uppercase tracking-wide text-ink-500",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.hideBelow && HIDE_CLASSES[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-ink-50/70">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-3 align-middle text-[0.84rem] text-ink-700",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.hideBelow && HIDE_CLASSES[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-ink-200 bg-white p-3.5">
            <dl className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-wide text-ink-400">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 text-right text-[0.83rem] text-ink-800">
                    {column.mobileCell ? column.mobileCell(row) : column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Table product cell                                                  */
/* ------------------------------------------------------------------ */

export function ProductCell({
  image,
  title,
  subtitle,
  href,
}: {
  image: string;
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
        <Image src={image} alt="" fill sizes="44px" className="object-cover" unoptimized />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2-safe block text-[0.84rem] font-medium leading-snug text-ink-900">{title}</span>
        {subtitle && <span className="mt-0.5 block text-[0.72rem] text-ink-500">{subtitle}</span>}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group flex items-center gap-3 hover:text-brand-700">
        {content}
      </Link>
    );
  }

  return <span className="flex items-center gap-3">{content}</span>;
}

/* ------------------------------------------------------------------ */
/* Simple progress bar                                                 */
/* ------------------------------------------------------------------ */

export function MiniBar({
  value,
  max,
  tone = "brand",
}: {
  value: number;
  max: number;
  tone?: "brand" | "ocean" | "amber" | "rose";
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    brand: "bg-brand-600",
    ocean: "bg-ocean-600",
    amber: "bg-amber-500",
    rose: "bg-rose-brand",
  };

  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
        <span className={cn("block h-full rounded-full", colors[tone])} style={{ width: `${percent}%` }} />
      </span>
      <span className="text-[0.75rem] font-semibold text-ink-700">{formatNumber(value)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Live search input (client-driven via URL)                           */
/* ------------------------------------------------------------------ */

export function AdminSearch({
  action,
  defaultValue,
  placeholder = "Search…",
  children,
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-center gap-2.5">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 min-w-[12rem] flex-1 rounded-xl border border-ink-300 bg-white px-3.5 text-[0.84rem] transition-colors hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:max-w-xs"
      />
      {children}
      <button
        type="submit"
        className="h-10 shrink-0 rounded-xl bg-brand-600 px-4 text-[0.84rem] font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
}
