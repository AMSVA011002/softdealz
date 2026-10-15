import Link from "next/link";
import { ArrowRight, Compass, Home, Search, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { featuredCategories } from "@/lib/data/categories";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  const categories = featuredCategories(6).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
  }));

  return (
    <div className="surface-brand min-h-screen">
      <div className="container-page py-14 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Logo size="md" />
          <p className="mt-8 text-[5rem] font-extrabold leading-none text-gradient-brand sm:text-[7rem]">404</p>
          <h1 className="mt-2 text-fluid-3xl font-extrabold">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-fluid-base text-ink-600">
            The link may be out of date, the product might have sold out, or there&apos;s a typo in the address. Let&apos;s
            get you back to something useful.
          </p>

          <form action="/search" method="get" className="mx-auto mt-6 flex max-w-md gap-2">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                name="q"
                placeholder="Search products…"
                aria-label="Search products"
                className="h-11 w-full rounded-xl border border-ink-300 bg-white pl-10 pr-3.5 text-[0.88rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
              />
            </label>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <ButtonLink href="/">
              <Home className="size-4" /> Back to homepage
            </ButtonLink>
            <ButtonLink href="/products" variant="outline">
              <ShoppingBag className="size-4" /> All products
            </ButtonLink>
            <ButtonLink href="/help" variant="ghost">
              <Compass className="size-4" /> Visit help centre
            </ButtonLink>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <h2 className="text-center text-[0.8rem] font-bold uppercase tracking-[0.16em] text-ink-400">
              Popular departments
            </h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-[0.83rem] font-medium text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                  >
                    {category.name}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
