import { Check, CircleDot, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW_LABELS: Record<string, { title: string; description: string }> = {
  PENDING: { title: "Order placed", description: "We received your order and will confirm it shortly." },
  CONFIRMED: { title: "Confirmed", description: "Stock reserved and payment verified." },
  PROCESSING: { title: "Packing", description: "Your items are being picked and packed." },
  SHIPPED: { title: "Shipped", description: "Handed to the courier with live tracking." },
  DELIVERED: { title: "Delivered", description: "Enjoy your purchase!" },
  CANCELLED: { title: "Cancelled", description: "This order was cancelled." },
  REFUNDED: { title: "Refunded", description: "The amount has been returned to you." },
};

/**
 * Horizontal on wide screens, vertical on phones — so long status labels
 * always stay readable rather than squeezing into a narrow rail.
 */
export function OrderTimeline({
  order,
  flow,
  className,
}: {
  order: Order;
  flow: OrderStatus[];
  className?: string;
}) {
  const terminal = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentIndex = terminal ? flow.length : flow.indexOf(order.status);
  const eventFor = (status: string) => order.timeline.find((event) => event.status === status);

  if (terminal) {
    const event = eventFor(order.status);
    return (
      <div className={cn("flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4", className)}>
        <XCircle className="mt-0.5 size-5 shrink-0 text-rose-brand" />
        <div>
          <p className="text-[0.88rem] font-semibold text-rose-900">{FLOW_LABELS[order.status].title}</p>
          <p className="mt-0.5 text-[0.8rem] text-rose-700">
            {event?.message ?? FLOW_LABELS[order.status].description}
          </p>
          {event && <p className="mt-1 text-[0.74rem] text-rose-600">{formatDateTime(event.createdAt)}</p>}
        </div>
      </div>
    );
  }

  return (
    <ol className={cn("relative flex flex-col gap-6 sm:flex-row sm:gap-2", className)}>
      {flow.map((status, index) => {
        const complete = index <= currentIndex;
        const active = index === currentIndex;
        const event = eventFor(status);
        const label = FLOW_LABELS[status] ?? { title: status, description: "" };

        return (
          <li key={status} className="relative flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {/* connector */}
            {index < flow.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[0.68rem] top-8 h-[calc(100%-0.5rem)] w-0.5 sm:left-1/2 sm:top-[0.7rem] sm:h-0.5 sm:w-full",
                  index < currentIndex ? "bg-brand-600" : "bg-ink-200",
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-white",
                complete ? "bg-brand-600 text-white" : "bg-ink-200 text-ink-500",
              )}
            >
              {complete ? <Check className="size-3.5" /> : <CircleDot className="size-3" />}
            </span>

            <span className="min-w-0 sm:px-1">
              <span
                className={cn(
                  "block text-[0.82rem] font-semibold",
                  active ? "text-brand-700" : complete ? "text-ink-900" : "text-ink-400",
                )}
              >
                {label.title}
              </span>
              <span className="mt-0.5 block text-[0.74rem] leading-snug text-ink-500">
                {event ? formatDateTime(event.createdAt) : label.description}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
