"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const TONES: Record<string, string> = {
  PENDING: "border-amber-300 bg-amber-50 text-amber-800",
  CONFIRMED: "border-ocean-300 bg-ocean-50 text-ocean-800",
  PROCESSING: "border-ocean-300 bg-ocean-50 text-ocean-800",
  SHIPPED: "border-ocean-400 bg-ocean-100 text-ocean-900",
  DELIVERED: "border-brand-300 bg-brand-50 text-brand-800",
  CANCELLED: "border-rose-300 bg-rose-50 text-rose-800",
  REFUNDED: "border-ink-300 bg-ink-100 text-ink-700",
};

/**
 * Inline status changer. Uses a client-side pending flag so the row reflects
 * the change immediately, then the server action revalidates the page.
 */
export function OrderStatusForm({
  orderId,
  status,
  compact = false,
}: {
  orderId: string;
  status: string;
  compact?: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        setPending(true);
        try {
          await updateOrderStatusAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <span className="relative">
        <select
          name="status"
          defaultValue={status}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const previous = status;
            if (event.currentTarget.value === previous) return;
            form.requestSubmit();
          }}
          aria-label="Order status"
          disabled={pending}
          className={cn(
            "appearance-none rounded-lg border py-1.5 pl-2.5 pr-7 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:opacity-60",
            compact ? "text-[0.74rem]" : "text-[0.82rem]",
            TONES[status] ?? "border-ink-300 bg-white text-ink-700",
          )}
        >
          {FLOW.map((entry) => (
            <option key={entry} value={entry}>
              {LABELS[entry]}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] opacity-60">▼</span>
      </span>
      {pending && <Loader2 className="size-3.5 shrink-0 animate-spin text-brand-600" aria-label="Saving" />}
    </form>
  );
}
