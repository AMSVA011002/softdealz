import type { Metadata } from "next";
import { Download } from "lucide-react";
import { AdminPageHeader, AdminPanel } from "@/components/admin/kit";
import { DatabaseRestoreForm } from "@/components/admin/database-restore-form";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { ButtonLink } from "@/components/ui/button";
import { allSettings } from "@/lib/data/account";
import { all, countRows } from "@/lib/db";
import { readHeroSlides } from "@/lib/home/hero-slides";

export const metadata: Metadata = {
  title: "Store settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = allSettings();
  const heroSlides = readHeroSlides(settings.hero_slides);

  const tableCounts = [
    { label: "Products", value: countRows("products") },
    { label: "Categories", value: countRows("categories") },
    { label: "Brands", value: countRows("brands") },
    { label: "Customers", value: countRows("users", "role = 'CUSTOMER'") },
    { label: "Orders", value: countRows("orders") },
    { label: "Reviews", value: countRows("reviews") },
    { label: "Coupons", value: countRows("coupons") },
    { label: "Subscribers", value: countRows("newsletter_subscribers") },
  ];

  const recentSearches = all(
    "SELECT term, COUNT(*) AS hits FROM search_log GROUP BY term ORDER BY hits DESC LIMIT 5",
  ).map((row) => String(row.term));

  return (
    <>
      <AdminPageHeader
        title="Store settings"
        description="Manage store identity, branding and colors, customer policies, shipping, storefront layout, and system settings."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <StoreSettingsForm settings={settings} heroSlides={heroSlides} />

        <div className="space-y-5">
          <AdminPanel title="Database" description="SQLite file: data/softdealz.db">
            <dl className="grid grid-cols-2 gap-2.5">
              {tableCounts.map((entry) => (
                <div key={entry.label} className="rounded-xl bg-ink-50 px-3 py-2.5">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-400">{entry.label}</dt>
                  <dd className="mt-0.5 text-[0.95rem] font-extrabold text-ink-900">{entry.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-ink-100 pt-4">
              <ButtonLink href="/api/admin/database/backup" variant="outline">
                <Download className="size-4" /> Download database backup
              </ButtonLink>
              <p className="mt-2 text-[0.78rem] text-ink-500">
                Downloads a consistent SQLite backup containing the current store data.
              </p>
              <DatabaseRestoreForm />
            </div>
            <p className="mt-3 text-[0.78rem] text-ink-500">
              Run <span className="font-mono">npm run db:reset</span> to rebuild the demo dataset from the catalog files.
            </p>
          </AdminPanel>

          <AdminPanel title="Recent searches" description="What shoppers typed most recently">
            {recentSearches.length === 0 ? (
              <p className="text-[0.84rem] text-ink-400">No searches logged yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <li
                    key={term}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[0.8rem] text-ink-700"
                  >
                    {term}
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Environment" description="Read-only, for support calls">
            <ul className="space-y-2 text-[0.82rem]">
              {[
                ["Currency", process.env.NEXT_PUBLIC_CURRENCY ?? "LKR"],
                ["Store URL", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
                ["Runtime", `Node ${process.version}`],
                ["Data layer", "node:sqlite (WAL)"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">{label}</span>
                  <span className="truncate font-mono text-[0.78rem] text-ink-800">{value}</span>
                </li>
              ))}
            </ul>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
