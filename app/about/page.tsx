import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/nav";
import { SectionHeading } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About SoftDealz",
  description:
    "SoftDealz is a Sri Lankan marketplace connecting shoppers with vetted local sellers — transparent pricing, island-wide delivery and buyer protection on every order.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Buyer protection first",
    body: "Every order is covered from payment to delivery. If something arrives damaged or not as described, we make it right within 7 days.",
  },
  {
    icon: Truck,
    title: "Delivery that respects your time",
    body: "Orders placed before 2pm are dispatched the same working day. Colombo and suburbs usually arrive next-day; the rest of the island in 2–4 days.",
  },
  {
    icon: Leaf,
    title: "Less packaging, less waste",
    body: "We ship in recyclable cardboard, consolidate multi-item orders, and are working with sellers to remove single-use plastic from the supply chain.",
  },
  {
    icon: HeartHandshake,
    title: "Fair to sellers",
    body: "Local sellers keep more of every sale, get paid weekly, and receive free photography and listing support from our team.",
  },
];

const MILESTONES = [
  { year: "2019", text: "Started in a Colombo garage with 40 products from three local sellers." },
  { year: "2021", text: "Opened a fulfilment hub in Kelaniya and reached every one of the 25 districts." },
  { year: "2023", text: "Launched same-day delivery across the Western Province." },
  { year: "2025", text: "12,000+ listed products, 640 vetted sellers and 48,000 registered shoppers." },
];

const STATS = [
  { value: "12,000+", label: "Products listed" },
  { value: "640", label: "Vetted sellers" },
  { value: "48k+", label: "Registered shoppers" },
  { value: "25", label: "Districts served" },
];

export default function AboutPage() {
  return (
    <div className="surface-brand min-h-screen">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-3.5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About us" }]} />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <SectionHeading
          eyebrow="Our story"
          title="A marketplace built for Sri Lankan shoppers"
          description="SoftDealz began with a simple frustration: finding a fair price online shouldn't mean gambling on strangers. Today we bring thousands of products from vetted local sellers together with transparent pricing, reliable delivery and real human support."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-ink-200 bg-white p-5">
              <p className="text-fluid-3xl font-extrabold text-brand-700">{stat.value}</p>
              <p className="mt-1 text-[0.82rem] text-ink-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <h2 className="text-fluid-2xl font-extrabold">What we care about</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {VALUES.map((value) => (
                <div key={value.title} className="rounded-2xl border border-ink-200 bg-white p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <value.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-[0.95rem] font-bold text-ink-900">{value.title}</h3>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-600">{value.body}</p>
                </div>
              ))}
            </div>

            <h2 id="careers" className="pt-4 text-fluid-2xl font-extrabold">
              Careers
            </h2>
            <p className="text-[0.9rem] leading-relaxed text-ink-600">
              We&apos;re a small, hands-on team of engineers, category managers and customer champions working out of
              Colombo and Kelaniya. We hire for curiosity and follow-through rather than buzzwords, and we&apos;re
              remote-friendly across Sri Lanka.
            </p>
            <ul className="space-y-2.5">
              {[
                { role: "Senior Platform Engineer", location: "Colombo / Remote" },
                { role: "Category Manager — Home & Kitchen", location: "Kelaniya" },
                { role: "Customer Experience Associate", location: "Remote (Sri Lanka)" },
              ].map((job) => (
                <li
                  key={job.role}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3"
                >
                  <span>
                    <span className="block text-[0.88rem] font-semibold text-ink-900">{job.role}</span>
                    <span className="block text-[0.78rem] text-ink-500">{job.location}</span>
                  </span>
                  <Link
                    href="/contact?topic=careers"
                    className="text-[0.82rem] font-semibold text-brand-700 hover:underline"
                  >
                    Apply
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-ink-900">
                <Sparkles className="size-4 text-brand-600" /> Milestones
              </h2>
              <ol className="mt-4 space-y-4">
                {MILESTONES.map((milestone) => (
                  <li key={milestone.year} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 rounded-lg bg-ink-100 px-2 py-1 font-mono text-[0.72rem] font-bold text-ink-700">
                      {milestone.year}
                    </span>
                    <span className="text-[0.84rem] leading-relaxed text-ink-600">{milestone.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-ink-900">
                <Users className="size-4 text-ocean-600" /> Work with us
              </h2>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-600">
                Selling on SoftDealz is free to start — you only pay commission when an order ships.
              </p>
              <ButtonLink href="/contact?topic=sell" size="sm" className="mt-3" fullWidth>
                <Building2 className="size-4" /> Become a seller
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
