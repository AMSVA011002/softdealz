/**
 * Route-level loading placeholders.
 *
 * These are plain server components — no hooks, no data — so a `loading.tsx`
 * boundary can stream them immediately.
 *
 * Where boundaries live matters: a loading boundary makes the shell flush
 * before the page resolves, so `notFound()` / `redirect()` thrown *below* one
 * can no longer set the HTTP status (a 404 would arrive as a 200). They are
 * therefore used only on routes that can neither 404 nor redirect — the public
 * listing routes.
 */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="container-page py-8 lg:py-12" aria-busy="true">
      <span className="sr-only">Loading…</span>

      <div className="h-7 w-52 animate-pulse rounded-lg bg-ink-200" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-ink-100" />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="card-surface overflow-hidden">
            <div className="aspect-[4/3] w-full animate-pulse bg-ink-100" />
            <div className="space-y-2 p-3.5">
              <div className="h-3 w-3/4 animate-pulse rounded bg-ink-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-ink-200" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
