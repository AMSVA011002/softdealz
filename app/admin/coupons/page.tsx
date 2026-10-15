import type { Metadata } from "next";
import { Percent, Ticket, TrendingUp } from "lucide-react";
import { AdminPageHeader, AdminPanel, StatCard } from "@/components/admin/kit";
import { CouponManager } from "@/components/admin/coupon-manager";
import { Badge } from "@/components/ui/badge";
import { listCoupons } from "@/lib/data/coupons";
import { all } from "@/lib/db";
import { formatCompactPrice, formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = listCoupons();

  const usage = all(
    `SELECT coupon_code AS code, COUNT(*) AS uses, COALESCE(SUM(discount), 0) AS discount
       FROM orders WHERE coupon_code IS NOT NULL AND status NOT IN ('CANCELLED','REFUNDED')
      GROUP BY coupon_code`,
  ).reduce<Record<string, { uses: number; discount: number }>>((acc, row) => {
    acc[String(row.code)] = { uses: Number(row.uses ?? 0), discount: Number(row.discount ?? 0) };
    return acc;
  }, {});

  const rows = coupons.map((coupon) => ({
    ...coupon,
    uses: usage[coupon.code]?.uses ?? 0,
    discountGiven: usage[coupon.code]?.discount ?? 0,
    // eslint-disable-next-line react-hooks/purity -- This page renders dynamically per request.
    expired: Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()),
  }));

  const totalGiven = rows.reduce((sum, row) => sum + row.discountGiven, 0);
  const totalUses = rows.reduce((sum, row) => sum + row.uses, 0);
  const live = rows.filter((row) => row.isActive && !row.expired).length;

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Create discount codes, set minimum spend and track redemptions."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live coupons" value={String(live)} icon={<Ticket className="size-5" />} />
        <StatCard label="Total redemptions" value={String(totalUses)} tone="ocean" icon={<Percent className="size-5" />} />
        <StatCard
          label="Discount given"
          value={formatCompactPrice(totalGiven)}
          tone="amber"
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Most popular"
          value={rows.reduce((best, row) => (row.uses > (best?.uses ?? 0) ? row : best), rows[0])?.code ?? "—"}
          tone="brand"
          hint={rows.length ? `${rows.length} codes configured` : "No codes yet"}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <AdminPanel title="All coupons" description="Redemption numbers come from live orders" padded={false}>
          <ul className="divide-y divide-ink-100">
            {rows.length === 0 && <li className="p-5 text-[0.84rem] text-ink-500">No coupons created yet.</li>}
            {rows.map((coupon) => (
              <li key={coupon.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[0.95rem] font-extrabold text-ink-900">{coupon.code}</p>
                      {coupon.isActive && !coupon.expired ? (
                        <Badge tone="brand" size="sm">
                          Active
                        </Badge>
                      ) : coupon.expired ? (
                        <Badge tone="neutral" size="sm">
                          Expired
                        </Badge>
                      ) : (
                        <Badge tone="amber" size="sm">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[0.82rem] text-ink-600">{coupon.description}</p>
                    <p className="mt-1.5 text-[0.76rem] text-ink-500">
                      {coupon.type === "PERCENT"
                        ? `${coupon.value}% off`
                        : coupon.type === "FIXED"
                          ? `${formatPrice(coupon.value)} off`
                          : "Free shipping"}
                      {coupon.minSpend > 0 && ` · min spend ${formatPrice(coupon.minSpend)}`}
                      {coupon.maxUses > 0 && ` · ${coupon.uses}/${coupon.maxUses} used`}
                      {coupon.expiresAt &&
                        ` · ${coupon.expired ? "expired" : "expires"} ${formatDate(coupon.expiresAt)}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-400">Discount given</p>
                    <p className="text-fluid-lg font-extrabold text-brand-700">
                      {formatCompactPrice(coupon.discountGiven)}
                    </p>
                    <p className="text-[0.74rem] text-ink-500">{coupon.uses} orders</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title="Create or edit a coupon" description="Codes are uppercase letters, numbers and hyphens.">
          <CouponManager coupons={rows} />
        </AdminPanel>
      </div>
    </>
  );
}
