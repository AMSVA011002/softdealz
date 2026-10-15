"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Breadcrumbs                                                         */
/* ------------------------------------------------------------------ */

export function Breadcrumbs({
  items,
  className,
}: {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.78rem] text-ink-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="max-w-[10rem] truncate transition-colors hover:text-brand-700 sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn("max-w-[14rem] truncate", isLast && "font-semibold text-ink-800")}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5 shrink-0 text-ink-300" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export function Pagination({
  page,
  totalPages,
  hrefTemplate,
  className,
}: {
  page: number;
  totalPages: number;
  /** URL with a `{page}` placeholder, e.g. `/products?sort=newest&page={page}`. */
  hrefTemplate: string;
  className?: string;
}) {
  const buildHref = (target: number) =>
    target <= 1 ? hrefTemplate.replace(/[?&]?page=\{page\}/, "").replace(/\?$/, "") || "/" : hrefTemplate.replace("{page}", String(target));

  if (totalPages <= 1) return null;

  const pages: Array<number | "gap"> = [];
  const push = (value: number | "gap") => pages.push(value);

  const windowSize = 1;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= windowSize) {
      push(i);
    } else if (pages[pages.length - 1] !== "gap") {
      push("gap");
    }
  }

  const linkClass =
    "grid h-10 min-w-10 place-items-center rounded-lg border border-ink-200 bg-white px-2 text-[0.82rem] font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700";

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      {page > 1 && (
        <Link href={buildHref(page - 1)} className={linkClass} aria-label="Previous page">
          Prev
        </Link>
      )}
      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              linkClass,
              entry === page && "border-brand-600 bg-brand-600 text-white hover:text-white",
            )}
          >
            {entry}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className={linkClass} aria-label="Next page">
          Next
        </Link>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  scrollControls = false,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
  className?: string;
  scrollControls?: boolean;
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScrollControls = () => {
      setCanScrollLeft(viewport.scrollLeft > 0);
      setCanScrollRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1);
    };

    updateScrollControls();
    const observer = new ResizeObserver(updateScrollControls);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener("scroll", updateScrollControls, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", updateScrollControls);
    };
  }, [tabs]);

  const scrollTabs = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollBy({ left: direction * Math.max(160, viewport.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className={cn(scrollControls ? "flex items-center gap-1.5" : "", className)}>
      {scrollControls && (
        <button
          type="button"
          aria-label="Scroll settings tabs left"
          onClick={() => scrollTabs(-1)}
          disabled={!canScrollLeft}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:cursor-default disabled:opacity-35"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      <div
        ref={viewportRef}
        className={cn("no-scrollbar overflow-x-auto", scrollControls ? "min-w-0 flex-1" : "-mx-4 px-4 sm:mx-0 sm:px-0")}
      >
        <div role="tablist" className="flex w-max min-w-full items-center gap-1 border-b border-ink-200">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={cn(
                  "relative whitespace-nowrap px-3.5 pb-3 pt-2 text-[0.85rem] font-semibold transition-colors",
                  isActive ? "text-brand-700" : "text-ink-500 hover:text-ink-800",
                )}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[0.68rem]",
                      isActive ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {scrollControls && (
        <button
          type="button"
          aria-label="Scroll settings tabs right"
          onClick={() => scrollTabs(1)}
          disabled={!canScrollRight}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:cursor-default disabled:opacity-35"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

export function Accordion({
  items,
  defaultOpen = [],
  className,
}: {
  items: Array<{ id: string; question: string; answer: React.ReactNode }>;
  defaultOpen?: string[];
  className?: string;
}) {
  const [open, setOpen] = React.useState<string[]>(defaultOpen);

  const toggle = (id: string) =>
    setOpen((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  return (
    <div className={cn("divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-ink-50 sm:px-5"
            >
              <span className="text-[0.9rem] font-semibold text-ink-900">{item.question}</span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600">
                {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              </span>
            </button>
            {isOpen && (
              <div className="animate-[fade-in_0.2s_ease-out] px-4 pb-4 text-[0.86rem] leading-relaxed text-ink-600 sm:px-5">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown menu                                                       */
/* ------------------------------------------------------------------ */

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-[13rem] animate-[fade-up_0.16s_ease-out] overflow-hidden rounded-xl border border-ink-200 bg-white py-1.5 shadow-lift",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("button[type='submit'], input[type='submit']")
            ) {
              return;
            }
            setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  icon,
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & { icon?: React.ReactNode }) {
  return (
    <Link
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 text-[0.84rem] text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900",
        className,
      )}
      {...props}
    >
      {icon && <span className="text-ink-400">{icon}</span>}
      {children}
    </Link>
  );
}

export function DropdownButton({
  icon,
  children,
  className,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.84rem] transition-colors",
        tone === "danger"
          ? "text-rose-brand hover:bg-rose-50"
          : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
        className,
      )}
      {...props}
    >
      {icon && <span className={tone === "danger" ? "" : "text-ink-400"}>{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3.5 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-wider text-ink-400">
      {children}
    </p>
  );
}

export function DropdownDivider() {
  return <div className="my-1.5 h-px bg-ink-200" />;
}

/* ------------------------------------------------------------------ */
/* Sidebar nav (account + admin)                                       */
/* ------------------------------------------------------------------ */

export function NavLink({
  href,
  icon,
  children,
  badge,
  exact,
  onNavigate,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.86rem] font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15"
          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
      )}
    >
      {icon && <span className={cn("shrink-0", active ? "text-brand-600" : "text-ink-400")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[0.68rem] font-bold text-ink-700">
          {badge}
        </span>
      )}
    </Link>
  );
}

export { ChevronDown, ChevronRight };
