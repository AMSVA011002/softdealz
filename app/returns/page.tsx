import type { Metadata } from "next";
import { Ban, CheckCircle2, Clock, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading, Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { PolicyText } from "@/components/policies/policy-text";
import { allSettings } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Returns & refunds",
  description:
    "How to return an item to SoftDealz: 7-day return window, free collection on damaged goods and refunds within 3–5 working days.",
  alternates: { canonical: "/returns" },
};
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: RefreshCcw,
    title: "Start the return",
    body: "Open the order in your account, choose “Request a return” and pick a reason. It takes about a minute.",
  },
  {
    icon: Truck,
    title: "We collect it",
    body: "Our courier picks the parcel up from your address — free for damaged, defective or incorrect items.",
  },
  {
    icon: ShieldCheck,
    title: "We inspect it",
    body: "Once it reaches our hub we check the item and packaging, usually the same working day.",
  },
  {
    icon: Clock,
    title: "You get refunded",
    body: "Refunds land back on your original payment method within 3–5 working days, or as store credit instantly.",
  },
];

const ELIGIBLE = [
  "Unused items in their original packaging, with tags and accessories intact.",
  "Electronics with no signs of physical or liquid damage and with the seal unbroken where applicable.",
  "Items that arrived damaged, defective or different from the listing — reported within 48 hours of delivery.",
  "Wrong size or colour delivered compared with your order confirmation.",
];

const NOT_ELIGIBLE = [
  "Perishable goods (fresh food, flowers), once delivered.",
  "Personal care and hygiene items that have been opened or used.",
  "Custom-made, personalised or made-to-order products.",
  "Digital downloads, gift cards and other intangibles.",
  "Items damaged by misuse, unauthorised repair or normal wear and tear.",
];

export default function ReturnsPage() {
  const policy = allSettings().policy_returns?.trim();

  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Returns & refunds" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <SectionHeading
          eyebrow="Returns & refunds"
          title="Changed your mind? Return it within 7 days"
          description="If something isn't right, we'll collect it and put it right — a replacement, an exchange or your money back. Here's exactly how it works."
        />

        {policy ? (
          <PolicyText content={policy} />
        ) : (
        <>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-[0.75rem] font-bold text-ink-300">0{index + 1}</span>
              </div>
              <h2 className="mt-3 text-[0.95rem] font-bold text-ink-900">{step.title}</h2>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-600">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-fluid-lg font-bold text-ink-900">
              <CheckCircle2 className="size-5 text-brand-600" /> What can be returned
            </h2>
            <ul className="mt-3 space-y-2.5">
              {ELIGIBLE.map((item) => (
                <li key={item} className="flex gap-3 text-[0.86rem] leading-relaxed text-ink-600">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-fluid-lg font-bold text-ink-900">
              <Ban className="size-5 text-rose-brand" /> What can&apos;t
            </h2>
            <ul className="mt-3 space-y-2.5">
              {NOT_ELIGIBLE.map((item) => (
                <li key={item} className="flex gap-3 text-[0.86rem] leading-relaxed text-ink-600">
                  <Ban className="mt-0.5 size-4 shrink-0 text-rose-brand" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-[0.95rem] font-bold text-ink-900">Refund timelines</h2>
            <dl className="mt-3 space-y-2 text-[0.85rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Card refunds</dt>
                <dd className="font-semibold text-ink-900">3–5 working days</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Wallet credit</dt>
                <dd className="font-semibold text-ink-900">Instant</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Cash on delivery</dt>
                <dd className="font-semibold text-ink-900">Bank transfer, 2–3 days</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-[0.95rem] font-bold text-ink-900">Warranty claims</h2>
            <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-600">
              Manufacturing faults after the return window are covered by the product warranty. We&apos;ll lodge the
              claim with the brand&apos;s local agent and keep you updated by email.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-[0.95rem] font-bold text-ink-900">Need a hand?</h2>
            <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-600">
              Our team answers within one business day, Mon–Sat, 8:30am – 8:00pm.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink href="/contact" size="sm">
                Contact support
              </ButtonLink>
              <ButtonLink href="/account/orders" variant="outline" size="sm">
                My orders
              </ButtonLink>
            </div>
          </div>
        </div>

        <Alert tone="info" title="Return shipping" className="mt-8">
          Collection is free when the item is damaged, defective or incorrect. For change-of-mind returns we deduct the
          standard delivery fee from your refund.
        </Alert>
        </>
        )}
      </div>
    </div>
  );
}
