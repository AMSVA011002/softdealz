import type { Metadata } from "next";
import { Mail, MailCheck, Sparkles } from "lucide-react";
import { AdminPageHeader, AdminPanel, DataTable, StatCard, type Column } from "@/components/admin/kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listSubscribers } from "@/lib/data/account";
import { all } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Subscribers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SubscriberRow {
  id: string;
  email: string;
  createdAt: string;
  orders: number;
}

export default async function AdminSubscribersPage() {
  const subscribers = listSubscribers(500);

  const customerEmails = new Set(
    all("SELECT LOWER(email) AS email FROM users").map((row) => String(row.email)),
  );

  const rows: SubscriberRow[] = subscribers.map((subscriber) => ({
    id: subscriber.id,
    email: subscriber.email,
    createdAt: subscriber.createdAt,
    orders: customerEmails.has(subscriber.email.toLowerCase()) ? 1 : 0,
  }));

  const withAccount = rows.filter((row) => row.orders > 0).length;
  const thisMonth = rows.filter((row) => {
    const date = new Date(row.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const columns: Array<Column<SubscriberRow>> = [
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Mail className="size-3.5" />
          </span>
          <span className="text-[0.84rem] font-medium text-ink-900">{row.email}</span>
        </span>
      ),
    },
    {
      key: "account",
      header: "Shop account",
      cell: (row) =>
        row.orders > 0 ? (
          <Badge tone="brand" size="sm">
            Registered
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Newsletter only
          </Badge>
        ),
    },
    {
      key: "joined",
      header: "Subscribed",
      align: "right",
      cell: (row) => <span className="text-[0.8rem] text-ink-500">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Subscribers"
        description="People who asked for deals, drops and seasonal offers by email."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total subscribers" value={formatNumber(rows.length)} icon={<Mail className="size-5" />} />
        <StatCard label="Joined this month" value={formatNumber(thisMonth)} tone="ocean" icon={<Sparkles className="size-5" />} />
        <StatCard label="Also shoppers" value={formatNumber(withAccount)} tone="brand" icon={<MailCheck className="size-5" />} />
        <StatCard
          label="Newsletter only"
          value={formatNumber(rows.length - withAccount)}
          tone="amber"
          hint="Convert them with WELCOME10"
        />
      </div>

      <div className="mt-5">
        <AdminPanel title="Mailing list" description="Newest subscribers first" padded={false}>
          <div className="p-4 sm:p-5">
            <DataTable rows={rows} columns={columns} emptyMessage="No subscribers yet" caption="Newsletter subscribers" />
          </div>
          <p className="border-t border-ink-100 px-4 py-3 text-[0.75rem] text-ink-500 sm:px-5">
            Export hook: subscribers are stored in the <span className="font-mono">newsletter_subscribers</span> table —
            point your email provider at it to start sending.
          </p>
        </AdminPanel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AdminPanel title="Suggested broadcast" description="Copy-paste and send from your email tool">
          <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50 p-4">
            <p className="text-[0.85rem] font-semibold text-ink-900">Subject: Your 10% welcome code is inside 🎁</p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-600">
              Hi there, thanks for joining SoftDealz. Use code <span className="font-mono font-semibold">WELCOME10</span>{" "}
              for 10% off your first order, and enjoy free delivery over LKR 25,000 island-wide.
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            Compose in provider
          </Button>
        </AdminPanel>

        <AdminPanel title="List health" description="Keep deliverability high">
          <ul className="space-y-2.5 text-[0.84rem] text-ink-600">
            <li>· Send at most twice a week — deals on Tuesday, new arrivals on Friday.</li>
            <li>· Always include a one-click unsubscribe link.</li>
            <li>· Segment shoppers vs. newsletter-only subscribers for better open rates.</li>
            <li>· Wait for LKR 25,000+ carts to remind people about free shipping.</li>
          </ul>
        </AdminPanel>
      </div>
    </>
  );
}
