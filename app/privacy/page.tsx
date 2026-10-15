import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading, Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { PolicyText } from "@/components/policies/policy-text";
import { allSettings } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How SoftDealz collects, uses and protects your personal data — what we store, who we share it with, and how to exercise your rights.",
  alternates: { canonical: "/privacy" },
};
export const dynamic = "force-dynamic";

const UPDATED = "1 October 2026";

const SECTIONS = [
  {
    id: "what-we-collect",
    title: "What we collect",
    body: "We collect only what an order needs to reach you:",
    items: [
      "Account details — name, email address, phone number and a bcrypt hash of your password (never the password itself).",
      "Order details — the items you bought, prices, delivery address and order status history.",
      "Shopping convenience data — your cart, wishlist, saved addresses and notification history.",
      "Technical data — an httpOnly session cookie plus basic request logs used to keep the site secure and available.",
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    items: [
      "To take payment, pack, ship and track your orders, and to handle returns and warranty claims.",
      "To send transactional messages — order confirmations and delivery updates you asked for.",
      "To prevent fraud and abuse, including rate limiting repeated sign-in attempts.",
      "To improve the catalogue and search experience using aggregated, non-identifying statistics.",
    ],
  },
  {
    id: "sharing",
    title: "Who we share it with",
    items: [
      "Delivery partners receive the recipient name, address and phone number needed to complete delivery.",
      "Payment providers process card data directly; card numbers are never stored on our servers.",
      "We do not sell personal data, and we do not share it for third-party advertising.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    items: [
      "Order records are kept for seven years to satisfy accounting and warranty obligations.",
      "Marketing subscriptions are kept until you unsubscribe; unsubscribing is one click in any email.",
      "Session cookies expire after 30 days of inactivity, and immediately when you sign out.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    items: [
      "Access and export — see everything we hold about you from your account settings, or ask us for a copy.",
      "Correction — update your profile and addresses at any time under Account → Settings.",
      "Deletion — ask us to delete your account; we will remove personal data we are not legally required to retain.",
      "Complaints — raise a concern with support@softdealz.lk and we will respond within 14 days.",
    ],
  },
];

export default function PrivacyPage() {
  const policy = allSettings().policy_privacy?.trim();

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy policy" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow={`Last updated ${UPDATED}`}
            title="Privacy policy"
            description="SoftDealz is designed to hold as little of your data as possible. This page explains exactly what we keep, why, and how you stay in control."
          />

          {policy ? (
            <PolicyText content={policy} />
          ) : (
            <div className="mt-6 space-y-6">
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-40">
                  <h2 className="text-fluid-xl font-bold text-ink-900">{section.title}</h2>
                  {section.body && <p className="mt-2 text-[0.88rem] text-ink-600">{section.body}</p>}
                  <ul className="mt-3 space-y-2.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.88rem] leading-relaxed text-ink-600">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ocean-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <section id="cookies" className="scroll-mt-40">
                <h2 className="text-fluid-xl font-bold text-ink-900">Cookies and local storage</h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-ink-200 bg-white">
                  <table className="w-full text-left text-[0.84rem]">
                    <thead className="bg-ink-50 text-[0.72rem] uppercase tracking-wide text-ink-500">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Purpose
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Lifetime
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {[
                        { name: "softdealz_session", purpose: "Keeps you signed in", life: "30 days" },
                        { name: "softdealz_coupon", purpose: "Remembers an applied coupon", life: "7 days" },
                        { name: "softdealz:viewed", purpose: "Recently viewed products (device only)", life: "Until cleared" },
                      ].map((cookie) => (
                        <tr key={cookie.name}>
                          <td className="px-4 py-2.5 font-mono text-[0.78rem] text-ink-800">{cookie.name}</td>
                          <td className="px-4 py-2.5 text-ink-600">{cookie.purpose}</td>
                          <td className="px-4 py-2.5 text-ink-600">{cookie.life}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <Alert tone="info" title="Demo build notice">
                This deployment is a demonstration build. Payments are simulated and no data is shared with third-party
                advertising or analytics networks.
              </Alert>

              <div className="flex flex-wrap gap-2.5">
                <ButtonLink href="/account/settings" size="sm">
                  Manage my data
                </ButtonLink>
                <ButtonLink href="/terms" variant="outline" size="sm">
                  Terms of service
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
