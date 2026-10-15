"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  image: string;
  categoryName: string | null;
}

interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
}

const POPULAR = ["wireless headphones", "air fryer", "cricket bat", "smart watch", "rice cooker", "yoga mat"];

export function SearchBar({
  className,
  inputClassName,
  size = "md",
  autoFocus,
  onNavigate,
}: {
  className?: string;
  inputClassName?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<Suggestion[]>([]);
  const [categories, setCategories] = React.useState<CategorySuggestion[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced typeahead
  React.useEffect(() => {
    if (term.trim().length < 2) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          products?: Suggestion[];
          categories?: CategorySuggestion[];
        };
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
      } catch {
        /* aborted or offline — keep previous results */
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = term.trim();
    if (!query) return;
    setOpen(false);
    onNavigate?.();
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const showPanel = open;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search" className="relative flex w-full items-center">
        <Search className="pointer-events-none absolute left-3.5 size-[1.1rem] text-ink-400" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          inputMode="search"
          value={term}
          autoFocus={autoFocus}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for products, brands or categories…"
          aria-label="Search products"
          enterKeyHint="search"
          className={cn(
            "search-bar-input w-full rounded-full border border-ink-300 bg-white pl-11 pr-24 text-ink-900 placeholder:text-ink-400 transition-all",
            "hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12",
            size === "lg" ? "h-12 text-[0.95rem]" : "h-11 text-[0.88rem]",
            inputClassName,
          )}
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid size-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="submit"
            className="grid h-8 place-items-center rounded-full bg-brand-600 px-3.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Search
          </button>
        </div>
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 animate-[fade-up_0.16s_ease-out] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift">
          {term.trim().length < 2 ? (
            <div className="p-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-ink-400">
                <TrendingUp className="size-3.5" /> Popular right now
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => {
                      setTerm(entry);
                      setOpen(false);
                      onNavigate?.();
                      router.push(`/search?q=${encodeURIComponent(entry)}`);
                    }}
                    className="rounded-full bg-ink-100 px-3 py-1.5 text-[0.78rem] font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          ) : loading && products.length === 0 ? (
            <div className="flex items-center gap-2.5 p-4 text-[0.85rem] text-ink-500">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : products.length === 0 && categories.length === 0 ? (
            <div className="p-4 text-[0.85rem] text-ink-500">
              No matches for <span className="font-semibold text-ink-800">“{term}”</span>. Try a different word or
              browse all categories.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {categories.length > 0 && (
                <div className="border-b border-ink-100 p-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      <Search className="size-3.5 text-ink-400" />
                      <span>
                        Browse <span className="font-semibold text-ink-900">{category.name}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <ul className="p-2">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-ink-50"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        <Image src={product.image} alt="" fill sizes="44px" className="object-cover" unoptimized />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.85rem] font-medium text-ink-900">
                          {product.title}
                        </span>
                        {product.categoryName && (
                          <span className="block text-[0.72rem] text-ink-500">{product.categoryName}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => submit()}
                className="w-full border-t border-ink-100 bg-ink-50 px-4 py-2.5 text-[0.82rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                See all results for “{term}”
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
