import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  CreditCard,
  HelpCircle,
  Package,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  UserCog,
} from "lucide-react";
import { Accordion } from "@/components/ui/nav";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/nav";

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Answers about delivery, payments, returns, warranty and your SoftDealz account — plus a direct line to our support team.",
  alternates: { canonical: "/help" },
};

const TOPICS = [
  {
    icon: Truck,
    title: "Delivery & tracking",
    body: "Island-wide in 2–4 working days, free over LKR 25,000. Track any parcel with your order number.",
    href: "/track",
    linkLabel: "Track an order",
  },
  {
    icon: RefreshCcw,
    title: "Returns & refunds",
    body: "7-day returns on eligible items, refunds in 3–5 working days back to your original method.",
    href: "/help#returns",
    linkLabel: "Read the policy",
  },
  {
    icon: CreditCard,
    title: "Payments & coupons",
    body: "Cash on delivery or simulated card checkout. Stack a coupon, or use free-shipping codes at checkout.",
    href: "/help#payments",
    linkLabel: "Payment help",
  },
  {
    icon: ShieldCheck,
    title: "Warranty & repairs",
    body: "Official local warranties up to 24 months, with service through the brand's Sri Lankan agents.",
    href: "/help#warranty",
    linkLabel: "Warranty details",
  },
  {
    icon: UserCog,
    title: "Account & security",
    body: "Update your profile, manage addresses, change your password or suspend marketing emails.",
    href: "/account/settings",
    linkLabel: "Open settings",
  },
  {
    icon: Boxes,
    title: "Bulk & corporate orders",
    body: "Ordering for a team or reselling? Talk to us about volume pricing and consolidated invoicing.",
    href: "/contact",
    linkLabel: "Contact sales",
  },
];

const FAQS = [
  {
    id: "faq-delivery",
    question: "How long does delivery take?",
    answer:
      "Colombo and suburbs are usually next-day. Other districts take 2–4 working days. You'll get a tracking number by SMS and email as soon as your parcel leaves our warehouse, and you can follow it any time on the tracking page.",
  },
  {
    id: "faq-shipping-cost",
    question: "How much is delivery?",
    answer:
      "Delivery is free when your cart is LKR 25,000 or more, or when every item in the cart qualifies with free shipping. Otherwise a flat LKR 450 is added, plus any item-level delivery fee shown on the product page.",
  },
  {
    id: "faq-payments",
    question: "Which payment methods can I use?",
    answer:
      "Cash on delivery is available island-wide, and card checkout is supported through our simulated payment step (no real charge is made in this build). Coupons can be applied at checkout or on the cart page.",
  },
  {
    id: "faq-returns",
    question: "What is your returns policy?",
    answer:
      "Eligible items can be returned within 7 days of delivery in their original packaging. Faulty goods are covered by the manufacturer warranty; change-of-mind returns must be unused. Start a return from your orders page and we'll arrange pickup.",
  },
  {
    id: "faq-warranty",
    question: "Do products come with a warranty?",
    answer:
      "Yes. Every product page lists its warranty term, most commonly 6 to 24 months. Claims are handled by the brand's authorised service partner in Sri Lanka — we'll help you file them.",
  },
  {
    id: "faq-order-change",
    question: "Can I change or cancel an order?",
    answer:
      "While an order is still Pending or Confirmed you can contact support to change the address or cancel it. Once it has shipped, the courier can often redirect the parcel — talk to us and we'll try.",
  },
  {
    id: "faq-coupons",
    question: "A coupon code isn't working. What now?",
    answer:
      "Check the minimum spend and expiry date. Codes are case-insensitive but not stackable — only one coupon applies per order. If it still fails, send us the code and your cart total and we'll sort it out.",
  },
  {
    id: "faq-account",
    question: "How do I track my order?",
    answer:
      "Sign in and open My orders for a live timeline, or use the tracking page with your order number and the email used at checkout — no sign-in required.",
  },
];

export default function HelpPage() {
  return (
    <>
      <section className="surface-brand border-b border-ink-200">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help" }]} />
          <div className="mx-auto mt-5 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-brand-700 shadow-sm">
              <HelpCircle className="size-4" /> Help centre
            </span>
            <h1 className="mt-4 text-fluid-4xl font-extrabold">How can we help?</h1>
            <p className="mt-3 text-fluid-base text-ink-600">
              Search the answers below, or reach a human any day between 8:30am and 8:00pm.
            </p>

            <form action="/search" method="get" className="mx-auto mt-5 flex max-w-lg gap-2">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="Try “delivery”, “refund”, “warranty”…"
                  aria-label="Search help topics"
                  className="h-11 w-full rounded-xl border border-ink-300 bg-white pl-10 pr-3.5 text-[0.88rem] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
                />
              </label>
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container-page py-8 lg:py-10">
        {/* topics */}
        <section>
          <h2 className="text-fluid-2xl font-extrabold">Browse by topic</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <div key={topic.title} className="card-surface flex flex-col p-4">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <topic.icon className="size-5" />
                </span>
                <h3 className="mt-3 text-[0.95rem] font-bold text-ink-900">{topic.title}</h3>
                <p className="mt-1.5 flex-1 text-[0.83rem] leading-relaxed text-ink-600">{topic.body}</p>
                <Link
                  href={topic.href}
                  className="mt-3 text-[0.82rem] font-semibold text-brand-700 hover:underline"
                >
                  {topic.linkLabel} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ + anchors */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <h2 className="text-fluid-2xl font-extrabold">Frequently asked questions</h2>
            <p className="mt-1.5 text-[0.88rem] text-ink-500">
              Everything shoppers ask us most, answered without the runaround.
            </p>
            <div className="mt-5" id="payments">
              <Accordion
                defaultOpen={[FAQS[0].id]}
                items={FAQS.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answer }))}
              />
            </div>

            <div id="returns" className="mt-8 scroll-mt-24 rounded-2xl border border-ink-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-[1rem] font-bold text-ink-900">
                <RefreshCcw className="size-4 text-brand-600" /> Returns in three steps
              </h3>
              <ol className="mt-3 space-y-3">
                {[
                  "Open My orders and choose the item you want to return.",
                  "Tell us why and pick a pickup window that suits you.",
                  "Hand the parcel to our courier — refunds land in 3–5 working days.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[0.72rem] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-[0.85rem] text-ink-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div id="warranty" className="mt-5 scroll-mt-24 rounded-2xl border border-ink-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-[1rem] font-bold text-ink-900">
                <ShieldCheck className="size-4 text-brand-600" /> Warranty cover
              </h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-600">
                Electronics, appliances and tools carry manufacturer warranties between 6 and 24 months. Keep your order
                confirmation — it doubles as your proof of purchase. Warranty claims are logged by our support team and
                handed to the brand&apos;s local agent within one working day.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card-surface p-4 lg:sticky lg:top-28">
              <h3 className="text-[0.95rem] font-bold text-ink-900">Still stuck?</h3>
              <p className="mt-1.5 text-[0.83rem] text-ink-600">
                Our support team replies within a few hours on weekdays.
              </p>
              <div className="mt-3.5 space-y-2.5">
                <ButtonLink href="/contact" size="sm" fullWidth>
                  Contact support
                </ButtonLink>
                <ButtonLink href="/track" variant="outline" size="sm" fullWidth>
                  <Package className="size-3.5" /> Track an order
                </ButtonLink>
              </div>
              <ul className="mt-4 space-y-2 border-t border-ink-100 pt-3 text-[0.8rem] text-ink-600">
                <li>📞 +94 11 234 5678</li>
                <li>✉️ support@softdealz.lk</li>
                <li>🕘 Mon–Sat, 8:30am – 8:00pm</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
