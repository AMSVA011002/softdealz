import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import { AdminPageHeader, AdminPanel, StatCard } from "@/components/admin/kit";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/nav";
import { deleteReviewAction, moderateReviewAction } from "@/app/actions/admin";
import { countReviews, countReviewsFiltered, listReviewsAdmin, overallRating } from "@/lib/data/reviews";
import { formatDateTime, initials } from "@/lib/format";
import { intParam } from "@/lib/params";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const PER_PAGE = 15;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const page = intParam(params.page, 1, { min: 1, max: 10_000 });

  const reviews = listReviewsAdmin({
    status,
    q: params.q,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  const filteredTotal = countReviewsFiltered({ status, q: params.q });
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PER_PAGE));
  const rating = overallRating();

  const hrefTemplate = `/admin/reviews${(() => {
    const next = new URLSearchParams();
    if (status !== "ALL") next.set("status", status);
    if (params.q) next.set("q", params.q);
    const search = next.toString();
    return `${search ? `?${search}&` : "?"}page={page}`;
  })()}`;

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer feedback before it appears on product pages."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting moderation" value={String(countReviews("PENDING"))} icon={<MessageSquare className="size-5" />} tone="amber" />
        <StatCard label="Published" value={String(countReviews("APPROVED"))} icon={<Star className="size-5" />} tone="brand" />
        <StatCard label="Rejected" value={String(countReviews("REJECTED"))} icon={<ThumbsUp className="size-5" />} tone="rose" />
        <StatCard
          label="Store average"
          value={rating.average.toFixed(2)}
          hint={`${rating.total} published reviews`}
          icon={<Star className="size-5" />}
          tone="ocean"
        />
      </div>

      <div className="mt-5">
        <AdminPanel padded={false}>
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 p-4 sm:p-5">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {TABS.map((tab) => {
                const active = tab === status;
                return (
                  <Link
                    key={tab}
                    href={`/admin/reviews${tab === "ALL" ? "" : `?status=${tab}`}`}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                      active
                        ? "bg-brand-600 text-white"
                        : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
                    }`}
                  >
                    {tab === "ALL" ? "All reviews" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </Link>
                );
              })}
            </div>

            <form action="/admin/reviews" method="get" className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              {status !== "ALL" && <input type="hidden" name="status" value={status} />}
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search review text…"
                aria-label="Search reviews"
                className="h-10 flex-1 rounded-xl border border-ink-300 px-3.5 text-[0.83rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 sm:w-56 sm:flex-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-xl bg-ink-900 px-3.5 text-[0.82rem] font-semibold text-white hover:bg-ink-800"
              >
                Search
              </button>
            </form>
          </div>

          {reviews.length === 0 ? (
            <p className="p-8 text-center text-[0.85rem] text-ink-500">No reviews in this queue.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {reviews.map((review) => (
                <li key={review.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-ocean-600 text-[0.78rem] font-bold text-white"
                      aria-hidden
                    >
                      {initials(review.authorName)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-[0.86rem] font-semibold text-ink-900">{review.authorName}</p>
                        <StatusPill status={review.status} />
                        {review.productSlug && (
                          <Badge tone="neutral" size="sm">
                            {review.productTitle ?? "Product"}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <Rating value={review.rating} showValue={false} size="sm" />
                        <span className="text-[0.74rem] text-ink-400">{formatDateTime(review.createdAt)}</span>
                        <span className="text-[0.74rem] text-ink-400">{review.helpful} found helpful</span>
                      </div>

                      {review.title && <p className="mt-2 text-[0.85rem] font-semibold text-ink-900">{review.title}</p>}
                      <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-600">{review.body}</p>

                      {review.productSlug && (
                        <Link
                          href={`/product/${review.productSlug}#reviews`}
                          className="mt-2.5 inline-block text-[0.78rem] font-semibold text-brand-700 hover:underline"
                        >
                          View on product page
                        </Link>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {review.status !== "APPROVED" && (
                        <form action={moderateReviewAction}>
                          <input type="hidden" name="id" value={review.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <Button type="submit" size="sm" variant="outline">
                            Approve
                          </Button>
                        </form>
                      )}
                      {review.status !== "REJECTED" && (
                        <form action={moderateReviewAction}>
                          <input type="hidden" name="id" value={review.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <Button type="submit" size="sm" variant="ghost">
                            Reject
                          </Button>
                        </form>
                      )}
                      <form action={deleteReviewAction}>
                        <input type="hidden" name="id" value={review.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-rose-brand hover:bg-rose-50">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-4 py-4 sm:px-5">
            <p className="text-[0.78rem] text-ink-500">
              {filteredTotal} review{filteredTotal === 1 ? "" : "s"} match this filter
            </p>
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} hrefTemplate={hrefTemplate} />
            )}
          </div>
        </AdminPanel>
      </div>
    </>
  );
}
