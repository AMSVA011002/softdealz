import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "@/components/layout/contact-form";
import { Accordion } from "@/components/ui/nav";
import { Breadcrumbs } from "@/components/ui/nav";
import { allSettings } from "@/lib/data/account";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to SoftDealz — customer support, sales, bulk orders and partnership enquiries. Phone, email or send us a message.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

const CHANNELS = [
  {
    icon: Phone,
    label: "Call support",
    value: "+94 11 234 5678",
    href: "tel:+94112345678",
    hint: "Mon–Sat, 8:30am – 8:00pm",
  },
  {
    icon: Mail,
    label: "Email us",
    value: "support@softdealz.lk",
    href: "mailto:support@softdealz.lk",
    hint: "Replies within a few hours",
  },
  {
    icon: MessageSquare,
    label: "Order questions",
    value: "Use the tracking page",
    href: "/track",
    hint: "Live status without signing in",
  },
  {
    icon: Building2,
    label: "Bulk & corporate",
    value: "sales@softdealz.lk",
    href: "mailto:sales@softdealz.lk",
    hint: "Volume pricing and invoicing",
  },
];

export default function ContactPage() {
  const settings = allSettings();

  return (
    <>
      <section className="surface-brand border-b border-ink-200">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <div className="mt-4 max-w-3xl">
            <h1 className="text-fluid-4xl font-extrabold">We&apos;re here to help</h1>
            <p className="mt-3 text-fluid-base text-ink-600">
              Questions about an order, a product, or partnering with SoftDealz? Pick whichever channel suits you — a
              real person answers every message.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* form */}
          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-fluid-xl font-bold">Send us a message</h2>
            <p className="mt-1.5 text-[0.85rem] text-ink-500">
              Include your order number if you have one — it helps us answer faster.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

          {/* details */}
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {CHANNELS.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="card-surface group flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <channel.icon className="size-4.5" />
                  </span>
                  <span className="mt-3 text-[0.72rem] font-semibold uppercase tracking-wide text-ink-400">
                    {channel.label}
                  </span>
                  <span className="mt-0.5 text-[0.88rem] font-bold text-ink-900 group-hover:text-brand-700">
                    {channel.value}
                  </span>
                  <span className="mt-1 text-[0.76rem] text-ink-500">{channel.hint}</span>
                </a>
              ))}
            </div>

            <div className="card-surface p-5">
              <h2 className="flex items-center gap-2 text-[1rem] font-bold text-ink-900">
                <MapPin className="size-4 text-brand-600" /> Head office &amp; warehouse
              </h2>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-600">
                {settings.address_line ?? "112 Galle Road, Colombo 03, Sri Lanka"}
              </p>
              <p className="mt-3 flex items-center gap-2 text-[0.82rem] text-ink-500">
                <Clock className="size-3.5" /> Counter pickups: weekdays 9:00am – 5:30pm
              </p>

              <div
                className="mt-4 grid h-40 place-items-center rounded-2xl border border-ink-200 bg-ink-50 text-center"
                role="img"
                aria-label="Map placeholder showing the SoftDealz head office in Colombo"
              >
                <div>
                  <MapPin className="mx-auto size-6 text-brand-600" />
                  <p className="mt-1.5 text-[0.82rem] font-semibold text-ink-700">Colombo 03, Sri Lanka</p>
                  <p className="text-[0.75rem] text-ink-500">Deliveries dispatched from here daily</p>
                </div>
              </div>
            </div>

            <div className="card-surface p-5">
              <h2 className="text-[1rem] font-bold text-ink-900">Before you write in</h2>
              <div className="mt-3">
                <Accordion
                  items={[
                    {
                      id: "contact-1",
                      question: "Where is my order?",
                      answer:
                        "Check the tracking page with your order number — it shows each scan from our warehouse to your door. If it hasn't moved in 48 hours, contact us and we'll chase the courier.",
                    },
                    {
                      id: "contact-2",
                      question: "How do I return something?",
                      answer:
                        "Open My orders, choose the item and start a return. We arrange pickup from your address and refund within 3–5 working days of receiving the parcel.",
                    },
                    {
                      id: "contact-3",
                      question: "Can I change my delivery address?",
                      answer:
                        "Yes, as long as the order hasn't shipped. Send us the order number and the new address and we'll update it — otherwise we can redirect with the courier.",
                    },
                  ]}
                />
              </div>
              <p className="mt-3 text-[0.8rem] text-ink-500">
                More answers in the{" "}
                <Link href="/help" className="font-semibold text-brand-700 hover:underline">
                  help centre
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
