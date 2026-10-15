import type { Metadata } from "next";
import { SettingsForm } from "@/components/account/settings-form";
import { getCurrentUser } from "@/lib/auth";
import { allSettings } from "@/lib/data/account";
import { getCartCount } from "@/lib/data/cart";
import { listUserOrders } from "@/lib/data/orders";
import { listWishlist } from "@/lib/data/account";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = allSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-fluid-2xl font-extrabold">Account settings</h1>
        <p className="mt-0.5 text-[0.85rem] text-ink-500">
          Manage your profile, password and communication preferences.
        </p>
      </div>

      <SettingsForm user={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />

      <div className="card-surface p-4 sm:p-5">
        <h2 className="text-fluid-lg font-bold">Account summary</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Member since", value: formatDate(user.createdAt) },
            { label: "Account type", value: user.role.charAt(0) + user.role.slice(1).toLowerCase() },
            { label: "Orders placed", value: String(listUserOrders(user.id).length) },
            { label: "Wishlist items", value: String(listWishlist(user.id).length) },
            { label: "Items in cart", value: String(getCartCount(user.id)) },
            { label: "Email verified", value: user.emailVerified ? "Yes" : "Pending" },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-ink-50 px-3.5 py-2.5">
              <dt className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-400">{row.label}</dt>
              <dd className="mt-0.5 text-[0.88rem] font-semibold text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card-surface p-4 sm:p-5">
        <h2 className="text-fluid-lg font-bold">Need a hand?</h2>
        <p className="mt-1.5 text-[0.85rem] text-ink-500">
          Our support team is reachable on{" "}
          <a href={`tel:${(store.support_phone ?? "").replace(/\s+/g, "")}`} className="font-semibold text-brand-700">
            {store.support_phone ?? "+94 11 234 5678"}
          </a>{" "}
          or{" "}
          <a href={`mailto:${store.support_email ?? "support@softdealz.lk"}`} className="font-semibold text-brand-700">
            {store.support_email ?? "support@softdealz.lk"}
          </a>
          , Monday to Saturday, 8:30am – 8:00pm.
        </p>
      </div>
    </div>
  );
}
