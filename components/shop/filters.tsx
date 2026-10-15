"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { Drawer } from "@/components/ui/overlay";
import { cn, buildQuery } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

export interface FilterFacets {
  categories: Array<{ slug: string; name: string; count: number; parentName?: string | null }>;
  brands: Array<{ slug: string; name: string; count: number }>;
  priceBounds: { min: number; max: number };
  conditions: Array<{ value: string; label: string; count: number }>;
  total: number;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Most relevant" },
  { value: "popular", label: "Best selling" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

/* ------------------------------------------------------------------ */
/* URL state helpers                                                   */
/* ------------------------------------------------------------------ */

function useFilterState() {
  const router = useRouter();
  const params = useSearchParams();

  const getList = React.useCallback(
    (key: string) => params.getAll(key).flatMap((value) => value.split(",")).filter(Boolean),
    [params],
  );

  const push = React.useCallback(
    (updates: Record<string, string | string[] | number | boolean | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([key, value]) => {
        next.delete(key);
        if (value === null || value === "" || value === false) return;
        if (Array.isArray(value)) {
          if (value.length > 0) next.set(key, value.join(","));
        } else {
          next.set(key, String(value));
        }
      });
      next.delete("page"); // any filter change resets pagination
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  return { params, getList, push, router };
}

/* ------------------------------------------------------------------ */
/* Sort select                                                         */
/* ------------------------------------------------------------------ */

export function SortSelect() {
  const { params, push } = useFilterState();
  const current = params.get("sort") ?? "relevance";

  return (
    <div className="relative">
      <label htmlFor="sort" className="sr-only">
        Sort products
      </label>
      <select
        id="sort"
        value={current}
        onChange={(event) => push({ sort: event.target.value })}
        className="h-10 w-full appearance-none rounded-xl border border-ink-300 bg-white pl-3.5 pr-9 text-[0.84rem] font-medium text-ink-800 transition-colors hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:w-52"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter panel contents                                               */
/* ------------------------------------------------------------------ */

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-ink-200 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-[0.82rem] font-bold uppercase tracking-wide text-ink-900">{title}</span>
        <ChevronDown className={cn("size-4 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3.5 space-y-2.5">{children}</div>}
    </div>
  );
}

function FilterPanel({ facets, lockedCategory }: { facets: FilterFacets; lockedCategory?: boolean }) {
  const { params, getList, push } = useFilterState();

  const selectedBrands = getList("brand");
  const selectedConditions = getList("condition");
  const selectedRating = Number(params.get("rating") ?? 0);
  const inStock = params.get("stock") === "1";
  const freeShipping = params.get("shipping") === "1";
  const onSale = params.get("sale") === "1";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const [priceMin, setPriceMin] = React.useState(minPrice);
  const [priceMax, setPriceMax] = React.useState(maxPrice);

  React.useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [minPrice, maxPrice]);

  const toggleInList = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    push({ [key]: next });
  };

  return (
    <div className="divide-y divide-ink-200">
      {!lockedCategory && facets.categories.length > 0 && (
        <FilterGroup title="Category">
          <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {facets.categories.map((category) => (
              <Checkbox
                key={category.slug}
                checked={params.get("category") === category.slug}
                onChange={() =>
                  push({ category: params.get("category") === category.slug ? null : category.slug })
                }
                label={
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{category.name}</span>
                    <span className="shrink-0 text-[0.72rem] text-ink-400">{category.count}</span>
                  </span>
                }
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder={String(facets.priceBounds.min)}
            aria-label="Minimum price"
            className="h-10 w-full min-w-0 rounded-lg border border-ink-300 px-2.5 text-[0.82rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
          />
          <span className="text-ink-400">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder={String(facets.priceBounds.max)}
            aria-label="Maximum price"
            className="h-10 w-full min-w-0 rounded-lg border border-ink-300 px-2.5 text-[0.82rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: "Under 5k", min: 0, max: 5000 },
            { label: "5k–25k", min: 5000, max: 25000 },
            { label: "25k–100k", min: 25000, max: 100000 },
            { label: "100k+", min: 100000, max: facets.priceBounds.max },
          ].map((range) => {
            const active = priceMin === String(range.min) && priceMax === String(range.max);
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => {
                  setPriceMin(String(range.min));
                  setPriceMax(String(range.max));
                  push({ minPrice: range.min, maxPrice: range.max });
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[0.72rem] font-medium transition-colors",
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700",
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          variant="outline"
          fullWidth
          onClick={() => push({ minPrice: priceMin || null, maxPrice: priceMax || null })}
        >
          Apply price
        </Button>
        <p className="text-[0.72rem] text-ink-400">
          Range: {formatPrice(facets.priceBounds.min)} – {formatPrice(facets.priceBounds.max)}
        </p>
      </FilterGroup>

      {facets.brands.length > 0 && (
        <FilterGroup title="Brand">
          <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {facets.brands.map((brand) => (
              <Checkbox
                key={brand.slug}
                checked={selectedBrands.includes(brand.slug)}
                onChange={() => toggleInList("brand", brand.slug, selectedBrands)}
                label={
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{brand.name}</span>
                    <span className="shrink-0 text-[0.72rem] text-ink-400">{brand.count}</span>
                  </span>
                }
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Customer rating">
        {[4, 3, 2].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => push({ rating: selectedRating === rating ? null : rating })}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
              selectedRating === rating ? "bg-brand-50" : "hover:bg-ink-50",
            )}
          >
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "size-3.5",
                    index < rating ? "fill-amber-400 text-amber-400" : "text-ink-300",
                  )}
                  strokeWidth={index < rating ? 0 : 1.6}
                />
              ))}
            </span>
            <span className="text-[0.8rem] text-ink-600">& up</span>
          </button>
        ))}
      </FilterGroup>

      {facets.conditions.length > 0 && (
        <FilterGroup title="Condition" defaultOpen={false}>
          {facets.conditions.map((condition) => (
            <Checkbox
              key={condition.value}
              checked={selectedConditions.includes(condition.value)}
              onChange={() => toggleInList("condition", condition.value, selectedConditions)}
              label={
                <span className="flex items-center justify-between gap-2">
                  <span>{condition.label}</span>
                  <span className="text-[0.72rem] text-ink-400">{condition.count}</span>
                </span>
              }
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Other">
        <Checkbox
          checked={inStock}
          onChange={(event) => push({ stock: event.target.checked ? 1 : null })}
          label="In stock only"
        />
        <Checkbox
          checked={freeShipping}
          onChange={(event) => push({ shipping: event.target.checked ? 1 : null })}
          label="Free shipping"
        />
        <Checkbox
          checked={onSale}
          onChange={(event) => push({ sale: event.target.checked ? 1 : null })}
          label="On sale"
        />
      </FilterGroup>

      <div className="pt-4">
        <Button
          variant="outline"
          fullWidth
          onClick={() => push({ brand: null, condition: null, rating: null, stock: null, shipping: null, sale: null, minPrice: null, maxPrice: null, category: null })}
        >
          Clear all filters
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop sidebar + mobile drawer                                     */
/* ------------------------------------------------------------------ */

export function FilterSidebar({
  facets,
  lockedCategory = false,
}: {
  facets: FilterFacets;
  lockedCategory?: boolean;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-40 card-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-fluid-lg font-bold">Filters</h2>
          <span className="text-[0.75rem] text-ink-500">{facets.total} products</span>
        </div>
        <FilterPanel facets={facets} lockedCategory={lockedCategory} />
      </div>
    </aside>
  );
}

export function MobileFilterButton({
  facets,
  lockedCategory = false,
}: {
  facets: FilterFacets;
  lockedCategory?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { params } = useFilterState();

  // Count of active refinements, shown on the button.
  const activeCount = ["brand", "condition", "rating", "stock", "shipping", "sale", "minPrice", "maxPrice", "category"]
    .filter((key) => params.get(key))
    .length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-300 bg-white px-3.5 text-[0.84rem] font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700 lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[0.68rem] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filters"
        className="max-h-[88vh]"
        footer={
          <Button fullWidth size="lg" onClick={() => setOpen(false)}>
            Show {facets.total} products
          </Button>
        }
      >
        <FilterPanel facets={facets} lockedCategory={lockedCategory} />
      </Drawer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Active filter chips                                                 */
/* ------------------------------------------------------------------ */

export function ActiveFilterChips() {
  const { params, push } = useFilterState();

  const chips: Array<{ key: string; value?: string; label: string }> = [];

  const brandList = params.get("brand")?.split(",").filter(Boolean) ?? [];
  brandList.forEach((slug) => chips.push({ key: "brand", value: slug, label: slug.replace(/-/g, " ") }));

  const conditionList = params.get("condition")?.split(",").filter(Boolean) ?? [];
  conditionList.forEach((value) => chips.push({ key: "condition", value, label: value.toLowerCase() }));

  if (params.get("category")) chips.push({ key: "category", label: params.get("category")!.replace(/-/g, " ") });
  if (params.get("minPrice") || params.get("maxPrice")) {
    chips.push({
      key: "price",
      label: `${params.get("minPrice") ? formatPrice(Number(params.get("minPrice"))) : "Any"} – ${
        params.get("maxPrice") ? formatPrice(Number(params.get("maxPrice"))) : "Any"
      }`,
    });
  }
  if (params.get("rating")) chips.push({ key: "rating", label: `${params.get("rating")}★ & up` });
  if (params.get("stock")) chips.push({ key: "stock", label: "In stock" });
  if (params.get("shipping")) chips.push({ key: "shipping", label: "Free shipping" });
  if (params.get("sale")) chips.push({ key: "sale", label: "On sale" });
  if (params.get("q")) chips.push({ key: "q", label: `“${params.get("q")}”` });

  if (chips.length === 0) return null;

  const remove = (chip: { key: string; value?: string }) => {
    if (chip.key === "price") {
      push({ minPrice: null, maxPrice: null });
      return;
    }
    if (chip.value && (chip.key === "brand" || chip.key === "condition")) {
      const list = (params.get(chip.key)?.split(",") ?? []).filter((entry) => entry !== chip.value);
      push({ [chip.key]: list });
      return;
    }
    push({ [chip.key]: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value ?? ""}`}
          type="button"
          onClick={() => remove(chip)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white py-1 pl-2.5 pr-2 text-[0.75rem] font-medium capitalize text-ink-700 transition-colors hover:border-rose-brand hover:text-rose-brand"
        >
          {chip.label}
          <X className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          push({
            brand: null,
            condition: null,
            rating: null,
            stock: null,
            shipping: null,
            sale: null,
            minPrice: null,
            maxPrice: null,
          })
        }
        className="text-[0.75rem] font-semibold text-brand-700 hover:text-brand-800"
      >
        Clear all
      </button>
    </div>
  );
}

export { buildQuery };
