import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Rating } from "@/components/ui/feedback";
import { StatusPill } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { mapReview } from "@/lib/data/mappers";
import { formatDate } from "@/lib/format";
import { listUserOrders } from "@/lib/data/orders";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = all(
    `SELECT r.*, p.title AS product_title, p.slug AS product_slug, p.images AS product_images
       FROM reviews r JOIN products p ON p.id = r.product_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`,
    [user.id],
  );

  const reviews = rows.map((row) => ({
    ...mapReview(row),
    productImage: (() => {
      try {
        return (JSON.parse(String(row.product_images ?? "[]")) as string[])[0] ?? null;
      } catch {
        return null;
      }
    })(),
  }));

  // Products from delivered orders that the shopper hasn't reviewed yet.
  const deliveredItems = listUserOrders(user.id)
    .filter((order) => order.status === "DELIVERED")
    .flatMap((order) => order.items)
    .filter((item, index, list) => list.findIndex((entry) => entry.slug === item.slug) === index)
    .filter((item) => !reviews.some((review) => review.productSlug === item.slug))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-fluid-2xl font-extrabold">My reviews</h1>
        <p className="mt-0.5 text-[0.85rem] text-ink-500">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} written · your feedback helps other shoppers decide.
        </p>
      </div>

      {deliveredItems.length > 0 && (
        <div className="card-surface p-4 sm:p-5">
          <h2 className="text-[0.85rem] font-bold uppercase tracking-wide text-ink-900">Waiting for your review</h2>
          <p className="mt-1 text-[0.82rem] text-ink-500">
            These arrived recently — tell other shoppers what you think.
          </p>
          <ul className="mt-4 space-y-3">
            {deliveredItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  <Image src={item.image} alt="" fill sizes="48px" className="object-cover" unoptimized />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}#reviews`}
                    className="line-clamp-1 text-[0.84rem] font-medium text-ink-900 hover:text-brand-700"
                  >
                    {item.title}
                  </Link>
                  <span className="text-[0.75rem] text-ink-500">Delivered</span>
                </span>
                <ButtonLink href={`/product/${item.slug}#reviews`} size="sm" variant="outline">
                  Write review
                </ButtonLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="You haven't written any reviews"
          description="Once you've received an order, share a few words to help the community."
          action={<ButtonLink href="/account/orders">View my orders</ButtonLink>}
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="card-surface p-4 sm:p-5">
              <div className="flex gap-3.5">
                {review.productImage && (
                  <Link
                    href={`/product/${review.productSlug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100"
                  >
                    <Image src={review.productImage} alt="" fill sizes="64px" className="object-cover" unoptimized />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/product/${review.productSlug}`}
                      className="text-[0.86rem] font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {review.productTitle}
                    </Link>
                    <StatusPill status={review.status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <Rating value={review.rating} showValue={false} size="sm" />
                    <span className="text-[0.74rem] text-ink-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.title && <p className="mt-2 text-[0.85rem] font-semibold text-ink-900">{review.title}</p>}
                  <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-600">{review.body}</p>
                  <p className="mt-2 text-[0.74rem] text-ink-400">{review.helpful} shoppers found this helpful</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
