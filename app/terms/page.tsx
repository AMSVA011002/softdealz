import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { PolicyText } from "@/components/policies/policy-text";
import { allSettings } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that govern shopping on SoftDealz: accounts, pricing, orders, delivery, returns, and your rights as a buyer.",
  alternates: { canonical: "/terms" },
};
export const dynamic = "force-dynamic";

const UPDATED = "1 October 2026";

interface Clause {
  id: string;
  title: string;
  points: string[];
}

const CLAUSES: Clause[] = [
  {
    id: "using-softdealz",
    title: "1. Using SoftDealz",
    points: [
      "You must be 18 or older, or have permission from a parent or guardian, to place an order.",
      "Keep your password private. You are responsible for activity that happens under your account.",
      "Do not scrape, resell or automate access to the catalogue without written permission.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and accuracy",
    points: [
      "Provide accurate contact details — we share your phone number with the courier so they can reach you.",
      "We may suspend accounts involved in fraud, abusive behaviour or repeated unpaid deliveries.",
      "You can ask us to close your account at any time by writing to support@softdealz.lk.",
    ],
  },
  {
    id: "pricing",
    title: "3. Pricing and availability",
    points: [
      "All prices are in Sri Lankan Rupees and include applicable taxes unless stated otherwise.",
      "Stock is confirmed when your order is picked. If an item sells out, we contact you and refund that line in full.",
      "Obvious pricing errors (for example, a laptop listed at LKR 100) may be cancelled and refunded before dispatch.",
    ],
  },
  {
    id: "orders",
    title: "4. Orders, payment and coupons",
    points: [
      "An order is a request to buy. The contract forms when we confirm dispatch.",
      "Cash on delivery, cards and wallet payments are shown at checkout. Card details never touch our servers.",
      "One coupon per order unless stated. Coupons cannot be exchanged for cash and may be withdrawn at any time.",
    ],
  },
  {
    id: "delivery",
    title: "5. Delivery",
    points: [
      "We deliver to all 25 districts. Typical delivery is 1–2 working days in Colombo and 2–4 days elsewhere.",
      "Someone must be available to receive the parcel, or arrange a reschedule with the courier.",
      "Risk passes to you on delivery; report damage within 48 hours so we can investigate with the carrier.",
    ],
  },
  {
    id: "returns",
    title: "6. Returns, refunds and warranty",
    points: [
      "Unused items in original packaging can be returned within 7 days of delivery.",
      "Refunds are issued to the original payment method within 3–5 working days of us receiving the return.",
      "Warranty claims are handled with the manufacturer's local agent; we will help you lodge them.",
    ],
  },
  {
    id: "liability",
    title: "7. Liability",
    points: [
      "We are not liable for indirect losses such as lost profit or opportunity.",
      "Nothing in these terms limits rights you have under Sri Lankan consumer protection law.",
      "Third-party sellers are responsible for the accuracy of their listings; SoftDealz mediates disputes in good faith.",
    ],
  },
  {
    id: "changes",
    title: "8. Changes to these terms",
    points: [
      "We may update these terms to reflect changes in law or our service. The revision date is shown above.",
      "Continuing to use SoftDealz after a change means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  const policy = allSettings().policy_terms?.trim();

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of service" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow={`Last updated ${UPDATED}`}
            title="Terms of service"
            description="These terms explain how SoftDealz works, what you can expect from us, and what we expect from you. Plain language, no surprises."
          />

          {policy ? (
            <PolicyText content={policy} />
          ) : (
            <div className="mt-8 space-y-8">
              {CLAUSES.map((clause) => (
                <section key={clause.id} id={clause.id} className="scroll-mt-40">
                  <h2 className="text-fluid-xl font-bold text-ink-900">{clause.title}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {clause.points.map((point) => (
                      <li key={point} className="flex gap-3 text-[0.88rem] leading-relaxed text-ink-600">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-[0.95rem] font-bold text-ink-900">Questions about these terms?</h2>
            <p className="mt-1.5 text-[0.86rem] text-ink-600">
              Write to <span className="font-semibold text-ink-800">support@softdealz.lk</span> or call
              +94 11 234 5678 during business hours (Mon–Sat, 8:30am – 8:00pm).
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <ButtonLink href="/contact" size="sm">
                Contact support
              </ButtonLink>
              <ButtonLink href="/privacy" variant="outline" size="sm">
                Privacy policy
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
