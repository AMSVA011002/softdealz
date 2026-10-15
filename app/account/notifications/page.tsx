import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/data/account";
import { markNotificationsReadAction, markNotificationReadAction } from "@/app/actions/shop";
import { formatDateTime, timeAgo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  ORDER: "Order",
  PROMO: "Promotion",
  INFO: "Info",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = listNotifications(user.id, 50);
  const unread = notifications.filter((entry) => !entry.read);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-fluid-2xl font-extrabold">Notifications</h1>
          <p className="mt-0.5 text-[0.85rem] text-ink-500">
            {unread.length > 0
              ? `${unread.length} unread of ${notifications.length}`
              : `All ${notifications.length} notifications read`}
          </p>
        </div>

        {unread.length > 0 && (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="size-3.5" /> Mark all as read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-6" />}
          title="No notifications yet"
          description="Order updates, delivery alerts and offers will show up here."
          action={
            <ButtonLink href="/products" variant="outline">
              Browse products
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`card-surface flex items-start gap-3.5 p-4 ${
                notification.read ? "" : "border-l-4 border-l-brand-600"
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  notification.read ? "bg-ink-100 text-ink-500" : "bg-brand-50 text-brand-600"
                }`}
              >
                <Bell className="size-4.5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[0.88rem] font-semibold text-ink-900">{notification.title}</p>
                  <Badge tone={notification.type === "ORDER" ? "ocean" : notification.type === "PROMO" ? "brand" : "neutral"} size="sm">
                    {TYPE_LABELS[notification.type] ?? notification.type}
                  </Badge>
                  {!notification.read && (
                    <span className="size-2 rounded-full bg-brand-600" aria-label="Unread" />
                  )}
                </div>
                <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-600">{notification.body}</p>
                <p className="mt-1.5 text-[0.74rem] text-ink-400" title={formatDateTime(notification.createdAt)}>
                  {timeAgo(notification.createdAt)}
                </p>
              </div>

              {!notification.read && (
                <form action={markNotificationReadAction.bind(null, notification.id)}>
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[0.78rem] text-ink-500">
        Want fewer emails? Adjust your{" "}
        <Link href="/account/settings" className="font-semibold text-brand-700 hover:underline">
          notification preferences
        </Link>
        .
      </p>
    </div>
  );
}
