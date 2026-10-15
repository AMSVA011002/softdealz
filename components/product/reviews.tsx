"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, MessageSquare, Star, ThumbsUp } from "lucide-react";
import { submitReviewAction, type ReviewState } from "@/app/actions/shop";
import { Button } from "@/components/ui/button";
import { RatingInput, EmptyState } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types";

export interface RatingSummary {
  buckets: Record<number, number>;
  total: number;
  average: number;
}

/* ------------------------------------------------------------------ */
/* Rating breakdown                                                    */
/* ------------------------------------------------------------------ */

export function ReviewList({
  reviews,
  summary,
  productTitle,
}: {
  reviews: Review[];
  summary: RatingSummary;
  productTitle: string;
}) {
  const [helpful, setHelpful] = React.useState<string[]>([]);
  const [visible, setVisible] = React.useState(4);

  const markHelpful = (id: string) => {
    if (helpful.includes(id)) return;
    setHelpful((current) => [...current, id]);
  };

  if (summary.total === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="size-6" />}
        title="No reviews yet"
        description={`Be the first to review ${productTitle}. Your feedback helps other shoppers decide.`}
        compact
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* summary */}
      <div className="grid gap-5 rounded-2xl border border-ink-200 bg-white p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:p-5">
        <div className="text-center sm:text-left">
          <p className="text-fluid-4xl font-extrabold leading-none text-ink-900">
            {summary.average.toFixed(1)}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-0.5 sm:justify-start" aria-hidden>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-4",
                  star <= Math.round(summary.average)
                    ? "fill-amber-400 text-amber-400"
                    : "text-ink-300",
                )}
                strokeWidth={star <= Math.round(summary.average) ? 0 : 1.6}
              />
            ))}
          </div>
          <p className="mt-1 text-[0.78rem] text-ink-500">
            {summary.total} verified review{summary.total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.buckets[star] ?? 0;
            const percent = summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-[0.76rem] font-medium text-ink-600">{star} star</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-[0.74rem] text-ink-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* list */}
      <ul className="space-y-4">
        {reviews.slice(0, visible).map((review) => (
          <li key={review.id} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-[0.8rem] font-bold text-white">
                {initials(review.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[0.86rem] font-semibold text-ink-900">{review.authorName}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[0.68rem] font-semibold text-brand-700">
                    <CheckCircle2 className="size-3" /> Verified buyer
                  </span>
                  <span className="text-[0.74rem] text-ink-400">{formatDateTime(review.createdAt)}</span>
                </div>

                <div className="mt-1.5 flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-3.5",
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-ink-300",
                      )}
                      strokeWidth={star <= review.rating ? 0 : 1.6}
                    />
                  ))}
                </div>

                {review.title && (
                  <p className="mt-2 text-[0.88rem] font-semibold text-ink-900">{review.title}</p>
                )}
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink-600">{review.body}</p>

                <button
                  type="button"
                  onClick={() => markHelpful(review.id)}
                  disabled={helpful.includes(review.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
                >
                  <ThumbsUp className="size-3.5" />
                  {helpful.includes(review.id) ? "Thanks for the feedback" : `Helpful (${review.helpful})`}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visible < reviews.length && (
        <Button variant="outline" onClick={() => setVisible((value) => value + 6)} className="mx-auto flex">
          Show more reviews ({reviews.length - visible} remaining)
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review form                                                         */
/* ------------------------------------------------------------------ */

const INITIAL: ReviewState = {};

export function ReviewForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, INITIAL);
  const [rating, setRating] = React.useState(5);

  if (state.success) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5">
        <CheckCircle2 className="size-5 shrink-0 text-brand-600" />
        <p className="text-[0.85rem] font-medium text-brand-800">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
      <h3 className="text-[0.95rem] font-bold text-ink-900">Write a review</h3>
      <p className="mt-0.5 text-[0.8rem] text-ink-500">
        Share what you liked or didn&apos;t — it helps other shoppers.
      </p>

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-4">
        <p className="mb-1.5 text-[0.8rem] font-semibold text-ink-700">Your rating</p>
        <RatingInput value={rating} onChange={setRating} />
        {state.fieldErrors?.rating && (
          <p className="mt-1 text-[0.75rem] font-medium text-rose-brand">{state.fieldErrors.rating}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Review title" htmlFor="review-title">
          <Input id="review-title" name="title" placeholder="Sum it up in a few words" maxLength={80} />
        </Field>

        <Field label="Your review" htmlFor="review-body" required error={state.fieldErrors?.body}>
          <Textarea
            id="review-body"
            name="body"
            required
            rows={4}
            placeholder="What did you like? How was the quality and delivery?"
            invalid={Boolean(state.fieldErrors?.body)}
          />
        </Field>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-[0.8rem] font-medium text-rose-brand">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={pending} className="mt-4">
        Publish review
      </Button>
    </form>
  );
}
