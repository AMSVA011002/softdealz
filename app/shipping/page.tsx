import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, PackageCheck, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/data/cart";
import { formatPrice } from "@/lib/format";
import { PolicyText } from "@/components/policies/policy-text";
import { allSettings } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Shipping & delivery",
  description:
    "Delivery times, charges and courier information for SoftDealz orders — free shipping over LKR 25,000, island-wide coverage and cash on delivery.",
  alternates: { canonical: "/shipping" },
};
export const dynamic = "force-dynamic";

const ZONES = [
  { zone: "Colombo & suburbs", time: "1–2 working days", note: "Same-day available on selected items" },
  { zone: "Western Province", time: "1–3 working days", note: "Dispatch same day before 2pm" },
  { zone: "Other districts", time: "2–4 working days", note: "Covers all 25 districts" },
  { zone: "Remote / rural addresses", time: "3–5 working days", note: "Courier may call before arriving" },
];

export default function ShippingPage() {
  const settings = allSettings();
  const policy = settings.policy_shipping?.trim();

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shipping & delivery" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <SectionHeading
          eyebrow="Shipping & delivery"
          title="Where we deliver, and how fast"
          description={`Orders over ${formatPrice(
            FREE_SHIPPING_THRESHOLD,
          )} ship free. Below that, standard delivery is ${formatPrice(
            STANDARD_SHIPPING_FEE,
          )} — and items marked “free shipping” are always free, whatever the order value.`}
        />

        {policy ? (
          <PolicyText content={policy} />
        ) : (
        <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, label: "Island-wide", value: "25 districts" },
            { icon: Clock, label: "Dispatch cut-off", value: "2:00 pm" },
            { icon: PackageCheck, label: "Delivery attempts", value: "Up to 3" },
            { icon: MapPin, label: "Pickup points", value: "180+ outlets" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-ink-200 bg-white p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-[0.95rem] font-bold text-ink-900">{item.value}</p>
              <p className="text-[0.8rem] text-ink-500">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section>
              <h2 className="text-fluid-xl font-bold">Delivery times by zone</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-ink-200 bg-white">
                <table className="w-full text-left text-[0.85rem]">
                  <thead className="bg-ink-50 text-[0.72rem] uppercase tracking-wide text-ink-500">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Zone
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Estimate
                      </th>
                      <th scope="col" className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {ZONES.map((zone) => (
                      <tr key={zone.zone}>
                        <td className="px-4 py-3 font-medium text-ink-800">{zone.zone}</td>
                        <td className="px-4 py-3 text-ink-600">{zone.time}</td>
                        <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{zone.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-fluid-xl font-bold">How delivery charges work</h2>
              <ul className="mt-3 space-y-2.5 text-[0.87rem] leading-relaxed text-ink-600">
                <li>
                  A flat <span className="font-semibold text-ink-800">{formatPrice(STANDARD_SHIPPING_FEE)}</span>{" "}
                  standard fee applies to orders below the free-shipping threshold.
                </li>
                <li>
                  Bulkier items (furniture, large appliances) show an item-specific fee on the product page and in the
                  cart summary before you pay.
                </li>
                <li>
                  Orders that mix free-shipping and standard items are charged only for the standard lines.
                </li>
                <li>Cash on delivery is available island-wide; please have the exact amount ready.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-fluid-xl font-bold">Tracking your parcel</h2>
              <p className="mt-2 text-[0.87rem] leading-relaxed text-ink-600">
                As soon as your order is dispatched you&apos;ll receive an SMS and an account notification with the
                tracking number and carrier. You can also follow progress any time from your account or the public
                tracking page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <ButtonLink href="/track" size="sm">
                  Track an order
                </ButtonLink>
                <ButtonLink href="/help#delivery" variant="outline" size="sm">
                  Delivery FAQs
                </ButtonLink>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="text-[0.95rem] font-bold text-ink-900">Missed a delivery?</h2>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-600">
                Couriers attempt delivery up to three times and leave a note each time. You can call them to rearrange
                using the number on your tracking page.
              </p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="text-[0.95rem] font-bold text-ink-900">Damaged in transit?</h2>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-600">
                Report it within 48 hours and we&apos;ll collect the item free of charge and ship a replacement or
                refund you in full.
              </p>
              <Link href="/returns" className="mt-3 inline-block text-[0.84rem] font-semibold text-brand-700 hover:underline">
                Read the returns policy
              </Link>
            </div>
          </aside>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
